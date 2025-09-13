import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RiskZone } from './risk-zone.entity';
import { Repository } from 'typeorm';
import { Point } from 'geojson';

// Defines the expected data structure for creating a new risk zone.
// This is often a separate DTO file in larger applications.
export interface CreateRiskZoneDto {
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

@Injectable()
export class RiskZonesService {
  constructor(@InjectRepository(RiskZone) private repo: Repository<RiskZone>) {}

  /**
   * Finds all risk zones.
   */
  findAll() {
    return this.repo.find();
  }

  /**
   * Finds a single risk zone by its ID.
   * @param id The ID of the risk zone to find.
   * @throws NotFoundException if no zone is found.
   */
  async findById(id: number): Promise<RiskZone> {
    const zone = await this.repo.findOneBy({ id });
    if (!zone) {
      throw new NotFoundException(`Risk Zone with ID #${id} not found`);
    }
    return zone;
  }

  /**
   * Creates a new risk zone. It takes lat/lng as input from the controller
   * and converts it to the GeoJSON Point format required by the PostGIS 'location' column.
   * @param payload The data for the new risk zone.
   */
  create(payload: CreateRiskZoneDto): Promise<RiskZone> {
    // Create the GeoJSON Point object from the incoming latitude and longitude.
    // Note: The GeoJSON standard is [longitude, latitude].
    const location: Point = {
      type: 'Point',
      coordinates: [payload.lng, payload.lat],
    };

    const entity = this.repo.create({
      name: payload.name,
      radius: payload.radius,
      location, // Assign the complete Point object to the location property
    });

    return this.repo.save(entity);
  }

  /**
   * Deletes a risk zone by its ID.
   * @param id The ID of the risk zone to delete.
   * @throws NotFoundException if the zone to delete doesn't exist.
   */
  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Risk Zone with ID #${id} not found`);
    }
  }
}
