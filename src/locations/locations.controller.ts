import { Controller, Post, Body, Get } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  @Post('update')
  async update(@Body() dto: { touristId: string; lat: number; lng: number; timestamp?: string }) {
    return this.svc.processLocation(dto);
  }

  @Get('latest')
  async latest() {
    return this.svc.getLatestTouristPositions();
  }
}
