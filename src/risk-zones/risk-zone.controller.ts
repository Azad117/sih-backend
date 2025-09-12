import { Controller, Get, Post, Body } from '@nestjs/common';
import { RiskZonesService } from './risk-zone.service';

@Controller('risk-zones')
export class RiskZonesController {
  constructor(private readonly svc: RiskZonesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: { name: string; lat: number; lng: number; radius?: number }) {
    return this.svc.create(dto);
  }
}
