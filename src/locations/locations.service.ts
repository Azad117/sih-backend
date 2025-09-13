import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { Not, IsNull, Repository } from 'typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { RiskZone } from '../risk-zones/risk-zone.entity';
import { AlertsService } from '../alerts/alerts.service';
import { AlertsGateway } from '../alerts/alerts.gateway';
import { PoliceStation } from 'src/police-stations/police-station.entity';
import { Point } from 'geojson';

@Injectable()
export class LocationsService {
  // cooldown map to avoid spamming same police alert: { touristId_zoneId: timestamp }
  private policeAlertCooldown: Record<string, number> = {};

  private POLICE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown

  constructor(
    @InjectRepository(Location) private locRepo: Repository<Location>,
    @InjectRepository(Tourist) private touristRepo: Repository<Tourist>,
    @InjectRepository(RiskZone) private zoneRepo: Repository<RiskZone>,
    @InjectRepository(PoliceStation) private stationRepo: Repository<PoliceStation>,
    private alertsSvc: AlertsService,
    private alertsGateway: AlertsGateway,
  ) {}

  /**
   * OPTIMIZED: Notifies all stations covering a tourist's location without loading every station from the DB.
   */
  private async maybeCreatePoliceAlert(
    tourist: Tourist,
    zone: RiskZone,
    dist: number,
    currentLat: number,
    currentLng: number,
  ) {
    const key = `${tourist.touristId}_${zone.id}`;
    const now = Date.now();
    if (
      this.policeAlertCooldown[key] &&
      now - this.policeAlertCooldown[key] < this.POLICE_COOLDOWN_MS
    ) {
      return null;
    }

    let severity: string | undefined;
    if (dist <= 500) severity = 'CRITICAL_500';
    else if (dist <= 700) severity = 'CRITICAL_700';

    if (severity) {
      // ✅ createAlert will correctly find the single nearest station for assignment
      const alert = await this.alertsSvc.createAlert(
        tourist,
        zone.name,
        severity,
        Math.round(dist),
      );

      this.policeAlertCooldown[key] = now;

      // OPTIMIZED: Fetch ONLY the stations that have jurisdiction over the tourist's current location.
      const coveringStations = await this.findStationsCoveringPoint(currentLng, currentLat);

      // Notify each of these relevant stations via WebSocket
      for (const station of coveringStations) {
        this.alertsGateway.sendToPolice(station.id, {
          id: alert.id,
          touristId: tourist.touristId,
          touristName: tourist.name,
          zoneName: zone.name,
          severity: alert.severity,
          distanceMeters: alert.distanceMeters,
          createdAt: alert.createdAt,
        });
      }

      return alert;
    }
    return null;
  }

  /**
   * Main entrypoint: handle tourist location update
   */
  async processLocation(payload: {
    touristId: string;
    lat: number;
    lng: number;
    timestamp?: string;
  }) {
    const { touristId, lat, lng, timestamp } = payload;
    if (!touristId || typeof lat !== 'number' || typeof lng !== 'number')
      return { ok: false, error: 'Invalid payload' };

    let tourist = await this.touristRepo.findOneBy({ touristId });
    if (!tourist) {
      tourist = this.touristRepo.create({ touristId, name: touristId });
    }

    // UPDATED: Use GeoJSON Point for location fields
    const currentLocation: Point = { type: 'Point', coordinates: [lng, lat] };

    // Save location history (assuming Location entity is also updated for PostGIS)
    const loc = this.locRepo.create({
      tourist,
      location: currentLocation,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    await this.locRepo.save(loc);

    // Update tourist's last known position
    tourist.location = currentLocation;
    tourist.lastUpdated = new Date();
    await this.touristRepo.save(tourist);

    // OPTIMIZED: Broadcast tourist live position ONLY to stations covering their location.
    const coveringStations = await this.findStationsCoveringPoint(lng, lat);
    coveringStations.forEach((station) => {
      this.alertsGateway.sendToPolice(station.id, {
        touristId: tourist.touristId,
        name: tourist.name,
        lat,
        lng,
        lastUpdated: tourist.lastUpdated,
      });
    });

    // OPTIMIZED: Find the nearest risk zone and its distance in a single DB query.
    const nearestZone = await this.findNearestRiskZone(lng, lat);

    let touristAlert;
    if (nearestZone && nearestZone.distance <= nearestZone.radius) {
      touristAlert = {
        touristId,
        zoneName: nearestZone.name,
        distanceMeters: Math.round(nearestZone.distance),
        level: 'WARNING',
      };
    }

    let policeAlert;
    if (nearestZone) {
      const created = await this.maybeCreatePoliceAlert(
        tourist,
        nearestZone,
        nearestZone.distance,
        lat,
        lng,
      );
      if (created) policeAlert = created;
    }

    return {
      ok: true,
      touristId,
      location: { lat, lng, timestamp: timestamp || new Date().toISOString() },
      nearestZone: nearestZone
        ? {
            id: nearestZone.id,
            name: nearestZone.name,
            distanceMeters: Math.round(nearestZone.distance),
            radius: nearestZone.radius,
          }
        : null,
      touristAlert,
      policeAlert: policeAlert
        ? { id: policeAlert.id, severity: policeAlert.severity }
        : null,
    };
  }

  /**
   * Return latest tourist positions for global map
   */
  async getLatestTouristPositions() {
    // Note: For large numbers of tourists, pagination should be added here.
    const tourists = await this.touristRepo.find({ where: { location: Not(IsNull()) } });
    return tourists.map((t) => ({
      touristId: t.touristId,
      name: t.name,
      lat: t.location.coordinates[1], // UPDATED: Extract lat/lng from Point
      lng: t.location.coordinates[0],
      lastUpdated: t.lastUpdated,
    }));
  }

  // --- Helper Methods using PostGIS ---

  /**
   * Finds all police stations whose jurisdiction covers a given point.
   */
  private findStationsCoveringPoint(lng: number, lat: number): Promise<PoliceStation[]> {
    return this.stationRepo
      .createQueryBuilder('station')
      .where(
        `ST_DWithin(
          station.location,
          ST_MakePoint(:lng, :lat)::geography,
          station."jurisdictionRadius"
        )`, // --- FIXED: Quoted the column name to preserve case
        { lng, lat },
      )
      .getMany();
  }

  /**
   * Finds the single nearest risk zone to a point and returns it along with its distance.
   * Assumes the RiskZone entity also has a 'location: Point' and 'radius: number' field.
   */
  private async findNearestRiskZone(lng: number, lat: number): Promise<(RiskZone & { distance: number }) | null> {
    const query = this.zoneRepo
      .createQueryBuilder('zone')
      .select('zone')
      // Use ST_Distance to calculate the distance directly in the database
      .addSelect(
        'ST_Distance(zone.location, ST_MakePoint(:lng, :lat)::geography)',
        'distance',
      )
      .setParameters({ lng, lat })
      .orderBy('distance', 'ASC') // Order by the calculated distance
      .limit(1); // We only need the closest one

    const result = await query.getRawAndEntities();

    if (!result.entities[0]) {
      return null;
    }

    return {
      ...result.entities[0],
      distance: Math.round(result.raw[0].distance),
    };
  }
}

