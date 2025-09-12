import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TouristsService } from './tourist.service';

@Controller('tourists')
export class TouristsController {
  constructor(private readonly svc: TouristsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

 @Post()
  async create(@Body() body: {
    touristId: string;
    name: string;
    emergencyContact?: string;
    lat?: number;
    lng?: number;
    lastUpdated?: string;
    safetyScore?: number;
    validFrom: string;
    validTo: string;
  }) {
    return this.svc.create({
      ...body,
      validFrom: new Date(body.validFrom),
      validTo: new Date(body.validTo),
    });
  }

    @Get(':touristId')
    findById(@Param('touristId') touristId: string) {
        return this.svc.findByTouristId(touristId);
    }

}
