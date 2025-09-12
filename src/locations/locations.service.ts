import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { Repository } from 'typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { RiskZone } from '../risk-zones/risk-zone.entity';
import { AlertsService } from '../alerts/alerts.service';
import { AlertsGateway } from '../alerts/alerts.gateway';
import { getDistance } from '../shared/geo-utils';
import { PoliceStation } from 'src/police-stations/police-station.entity';

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
   * Handle possible police alert escalation
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
    // ✅ use tourist entity directly
    const alert = await this.alertsSvc.createAlert(
      tourist,
      zone.name,
      severity,
      Math.round(dist),
    );

    this.policeAlertCooldown[key] = now;

    // notify stations covering current location
    const stations = await this.stationRepo.find();
    for (const station of stations) {
      const d = getDistance(
        { lat: currentLat, lng: currentLng },
        { lat: station.lat, lng: station.lng },
      );
      if (d <= station.jurisdictionRadius) {
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

    // ensure tourist exists
    let tourist = await this.touristRepo.findOneBy({ touristId });
    if (!tourist) {
      tourist = this.touristRepo.create({ touristId, name: touristId });
      await this.touristRepo.save(tourist);
    }

    // save location
    const loc = this.locRepo.create({
      tourist,
      lat,
      lng,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    await this.locRepo.save(loc);

    // update tourist last known
    tourist.lat = lat;
    tourist.lng = lng;
    tourist.lastUpdated = new Date();
    await this.touristRepo.save(tourist);

    // broadcast tourist live position to all stations covering them
    const stations = await this.stationRepo.find();
    stations.forEach((station) => {
      const d = getDistance({ lat, lng }, { lat: station.lat, lng: station.lng });
      if (d <= station.jurisdictionRadius) {
        this.alertsGateway.sendToPolice(station.id, {
          touristId: tourist.touristId,
          name: tourist.name,
          lat,
          lng,
          lastUpdated: tourist.lastUpdated,
        });
      }
    });

    // check nearest risk zone
    const zones = await this.zoneRepo.find();
    let nearest: (RiskZone & { distance: number }) | null = null;
    let minDist = Infinity;
    for (const z of zones) {
      const d = getDistance({ lat, lng }, { lat: z.lat, lng: z.lng });
      if (d < minDist) {
        minDist = d;
        nearest = { ...z, distance: d };
      }
    }

    // tourist alert (entered zone)
    let touristAlert;
    if (nearest && minDist <= nearest.radius) {
      touristAlert = {
        touristId,
        zoneName: nearest.name,
        distanceMeters: Math.round(minDist),
        level: 'WARNING',
      };
    }

    // police escalation
    let policeAlert;
    if (nearest) {
      const created = await this.maybeCreatePoliceAlert(
        tourist,
        nearest,
        minDist,
        lat,
        lng,
      );
      if (created) policeAlert = created;
    }

    return {
      ok: true,
      touristId,
      location: { lat, lng, timestamp: timestamp || new Date().toISOString() },
      nearestZone: nearest
        ? {
            id: nearest.id,
            name: nearest.name,
            distanceMeters: Math.round(minDist),
            radius: nearest.radius,
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
    const tourists = await this.touristRepo.find();
    return tourists.map((t) => ({
      touristId: t.touristId,
      name: t.name,
      lat: t.lat,
      lng: t.lng,
      lastUpdated: t.lastUpdated,
    }));
  }
}
