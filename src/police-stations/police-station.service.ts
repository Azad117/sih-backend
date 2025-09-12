import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PoliceStation } from './police-station.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PoliceStationsService {
  constructor(
    @InjectRepository(PoliceStation)
    private repo: Repository<PoliceStation>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<PoliceStation>) {
    const ent = this.repo.create(data);
    return this.repo.save(ent);
  }

  update(id: number, data: Partial<PoliceStation>) {
    return this.repo.update(id, data);
  }
}
