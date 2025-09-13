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

   async findNearby(lat: number, lng: number): Promise<PoliceStation[]> {
    // The limit is now set to 1 to return only the top closest station.
    const limit = 1;

    return this.repo
      .createQueryBuilder('station')
      .addSelect('ST_Distance(station.location, ST_MakePoint(:lng, :lat)::geography)', 'distance')
      .where(
        `ST_DWithin(
          station.location,
          ST_MakePoint(:lng, :lat)::geography,
          station."jurisdictionRadius"
        )`,
        { lng, lat },
      )
      .orderBy('distance', 'ASC')
      .limit(limit)
      .getMany();
  }

  create(data: Partial<PoliceStation>) {
    const ent = this.repo.create(data);
    return this.repo.save(ent);
  }

  update(id: number, data: Partial<PoliceStation>) {
    return this.repo.update(id, data);
  }
}
