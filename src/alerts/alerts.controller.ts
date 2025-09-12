import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { Alert } from './alerts.entity';


@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}


   @Get('station/:stationId')
  async findByStation(@Param('stationId') stationId: number): Promise<Alert[]> {
    const alerts = await this.alertsService.findAll();
    return alerts.filter(
      (a) => a.policeStation && a.policeStation.id === stationId,
    );
  }
}