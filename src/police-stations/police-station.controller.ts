import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { PoliceStationsService } from './police-station.service';
import { Not, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { getDistance } from '../shared/geo-utils';

@Controller('police-stations')
export class PoliceStationsController {
  constructor(
    private readonly svc: PoliceStationsService,
    @InjectRepository(Tourist)
    private touristRepo: Repository<Tourist>,
  ) {}


  @Get()
  all() {
    return this.svc.findAll();
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.svc.findById(parseInt(id, 10));
  }

  @Get(':id/tourists')
  async touristsInJurisdiction(@Param('id') id: string): Promise<Tourist[]> {
    const station = await this.svc.findById(parseInt(id, 10));
    if (!station) throw new NotFoundException('Police station not found');

    const tourists = await this.touristRepo.find({
      where: { lat: Not(IsNull()), lng: Not(IsNull()) },
    });

    return tourists.filter((t) => {
      if (typeof t.lat !== 'number' || typeof t.lng !== 'number') return false;
      const dist = getDistance(
        { lat: t.lat, lng: t.lng },
        { lat: station.lat, lng: station.lng },
      );
      return dist <= station.jurisdictionRadius;
    });
  }


  @Post()
  create(@Body() dto: { name: string; lat: number; lng: number; jurisdictionRadius?: number }) {
    return this.svc.create(dto);
  }
}
