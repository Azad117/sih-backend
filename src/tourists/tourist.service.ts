import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tourist } from './tourist.entity';
import { Repository } from 'typeorm';
import { Point } from 'geojson';
import { Location } from '../locations/location.entity';
import { Alert } from '../alerts/alerts.entity';

@Injectable()
export class TouristsService {
  constructor(@InjectRepository(Tourist) private repo: Repository<Tourist>) {}

  async findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['locations', 'alerts'],
    });
  }

  async findByTouristId(touristId: string): Promise<Tourist> {
    // Step 1: Find the main tourist entity without any "many" relations.
    const tourist = await this.repo.findOne({
      where: { touristId },
    });
    if (!tourist) {
      throw new NotFoundException(`Tourist with ID "${touristId}" not found`);
    }
    // Step 3: Return the single, complete tourist object.
    return tourist;
  }

  /**
   * Creates a new tourist.
   * Now handles conversion of lat/lng to a GeoJSON Point.
   */
  async create(payload: {
    touristId: string;
    name: string;
    emergencyContact?: string;
    lat?: number;
    lng?: number;
    validFrom: Date;
    validTo: Date;
  }) {
    // Convert lat/lng to a GeoJSON Point object if they exist
    let location: Point | undefined;
    if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
      location = {
        type: 'Point',
        coordinates: [payload.lng, payload.lat], // GeoJSON is [longitude, latitude]
      };
    }

    const t = this.repo.create({
      touristId: payload.touristId,
      name: payload.name,
      emergencyContact: payload.emergencyContact,
      location: location, // Assign the new Point object
      lastUpdated: location ? new Date() : undefined,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      safetyScore: 80, // default
    });
    return this.repo.save(t);
  }

  /**
   * Updates a tourist's last known location.
   */
  async updateLocation(
    touristId: string,
    lat: number,
    lng: number,
  ) {
    const t = await this.findByTouristId(touristId);
    if (!t) throw new NotFoundException(`Tourist ${touristId} not found`);

    // Create the GeoJSON Point for the new location
    t.location = {
      type: 'Point',
      coordinates: [lng, lat],
    };
    t.lastUpdated = new Date();
    return this.repo.save(t);
  }

  /**
   * Updates the safety score of a tourist.
   */
  async updateSafetyScore(touristId: string, delta: number) {
    const t = await this.findByTouristId(touristId);
    if (!t) throw new NotFoundException(`Tourist ${touristId} not found`);

    t.safetyScore = Math.max(0, t.safetyScore + delta);
    return this.repo.save(t);
  }
}
