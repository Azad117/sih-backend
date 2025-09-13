import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alerts.entity';
import { PoliceStation } from 'src/police-stations/police-station.entity';
import { Tourist } from '../tourists/tourist.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private repo: Repository<Alert>,
    @InjectRepository(Tourist) private touristRepo: Repository<Tourist>,
    @InjectRepository(PoliceStation) private stationRepo: Repository<PoliceStation>,
  ) {}

  /**
   * Create an alert, supports both touristId and Tourist entity.
   */
  async createAlert(
    touristOrId: string | Tourist,
    zoneName: string,
    severity: string,
    distanceMeters: number,
  ): Promise<Alert> {
    let tourist: Tourist | null = null;

    if (typeof touristOrId === 'string') {
      tourist = await this.touristRepo.findOneBy({ touristId: touristOrId });
      if (!tourist) {
        throw new NotFoundException(`Tourist with ID "${touristOrId}" not found`);
      }
    } else {
      tourist = touristOrId;
    }

    // This now uses the new, efficient PostGIS-based method
    const station = await this.findStationForTourist(tourist);
    if (!station) {
      throw new NotFoundException('No police station found covering this tourist\'s location');
    }

    // UPDATED: Assigns the full entity for a proper relation
    const entry = this.repo.create({
      tourist,
      zoneName,
      severity,
      distanceMeters,
      policeStation: station,
    });

    return this.repo.save(entry);
  }

  /**
   * OPTIMIZED: Finds the single nearest police station covering a tourist's location using a direct PostGIS query.
   */
  private async findStationForTourist(tourist: Tourist): Promise<PoliceStation | null> {
    // Check for the new PostGIS location property
    if (!tourist.location?.coordinates) {
      return null;
    }

    const [lng, lat] = tourist.location.coordinates;

    // This single query finds all stations covering the point, sorts them by distance, and returns the closest one.
    const nearestStation = await this.stationRepo
      .createQueryBuilder('station')
      // Add a calculated 'distance' field to the selection
      .addSelect('ST_Distance(station.location, ST_MakePoint(:lng, :lat)::geography)', 'distance')
      // The WHERE clause filters to only include stations whose jurisdiction covers the tourist
      .where(
        `ST_DWithin(
          station.location,
          ST_MakePoint(:lng, :lat)::geography,
          station.jurisdictionRadius
        )`,
      )
      .setParameters({ lng, lat })
      // Order by the calculated distance to ensure the closest is first
      .orderBy('distance', 'ASC')
      .getOne(); // We only need the single closest station

    return nearestStation;
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      // UPDATED: Assumes the relation in Alert entity is named 'policeStation'
      relations: ['tourist', 'policeStation'],
    });
  }
}
