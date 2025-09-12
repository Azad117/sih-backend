import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alerts.entity';
import { PoliceStation } from 'src/police-stations/police-station.entity';
import { Tourist } from '../tourists/tourist.entity';
import { getDistance } from '../shared/geo-utils';

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
        throw new NotFoundException('Tourist not found');
      }
    } else {
      tourist = touristOrId;
    }

    const station = await this.findStationForTourist(tourist);
    if (!station) {
      throw new NotFoundException('No police station covers this tourist');
    }

    const entry = this.repo.create({
      tourist,
      zoneName,
      severity,
      distanceMeters,
      stationId: station.id, // make sure entity has this
    });

    return this.repo.save(entry);
  }

  /**
   * Find nearest police station that covers a tourist.
   */
  private async findStationForTourist(tourist: Tourist): Promise<PoliceStation | null> {
    if (tourist.lat === undefined || tourist.lng === undefined) {
      return null;
    }

    const stations = await this.stationRepo.find();
    let nearest: PoliceStation | null = null;
    let minDist = Infinity;

    for (const station of stations) {
      const d = getDistance(
        { lat: tourist.lat, lng: tourist.lng },
        { lat: station.lat, lng: station.lng },
      );
      if (d <= station.jurisdictionRadius && d < minDist) {
        nearest = station;
        minDist = d;
      }
    }

    return nearest;
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['tourist', 'station'], // ensure joined
    });
  }
}
