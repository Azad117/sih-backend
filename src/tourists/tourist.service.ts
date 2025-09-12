import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tourist } from './tourist.entity';
import { Repository } from 'typeorm';


@Injectable()
export class TouristsService {
  constructor(@InjectRepository(Tourist) private repo: Repository<Tourist>) {}

  async findAll() {
    return this.repo.find({
      relations: ['locations', 'alerts'], // include history
    });
    }

  async findByTouristId(touristId: string) {
    return this.repo.findOne({
      where: { touristId },
      relations: ['locations', 'alerts'],
    });
  }

  async create(payload: {
    touristId: string;
    name: string;
    emergencyContact?: string;
    lat?: number;
    lng?: number;
    validFrom: Date;
    validTo: Date;
  }) {
    const exists = await this.findByTouristId(payload.touristId);
    if (exists) return exists;

    const t = this.repo.create({
      touristId: payload.touristId,
      name: payload.name,
      emergencyContact: payload.emergencyContact,
      lat: payload.lat,
      lng: payload.lng,
      lastUpdated: payload.lat && payload.lng ? new Date() : undefined,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      safetyScore: 80, // default
    });
    return this.repo.save(t);
  }

  async updateLocation(
    touristId: string,
    lat: number,
    lng: number,
  ) {
    const t = await this.findByTouristId(touristId);
    if (!t) throw new Error(`Tourist ${touristId} not found`);

    t.lat = lat;
    t.lng = lng;
    t.lastUpdated = new Date();
    return this.repo.save(t);
  }


  async updateSafetyScore(touristId: string, delta: number) {
    const t = await this.findByTouristId(touristId);
    if (!t) throw new Error(`Tourist ${touristId} not found`);

    t.safetyScore = Math.max(0, t.safetyScore + delta);
    return this.repo.save(t);
  }
}
