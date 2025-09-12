import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RiskZone } from './risk-zone.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RiskZonesService {
  constructor(@InjectRepository(RiskZone) private repo: Repository<RiskZone>) {}

  findAll() {
    return this.repo.find();
  }

  create(zone: Partial<RiskZone>) {
    const entity = this.repo.create(zone);
    return this.repo.save(entity);
  }
}
