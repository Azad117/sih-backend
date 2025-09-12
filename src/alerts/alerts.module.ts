import { Module } from '@nestjs/common';
import { AlertsGateway } from './alerts.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alerts.entity';
import { AlertsService } from './alerts.service';
import { Tourist } from '../tourists/tourist.entity';
import { PoliceStation } from 'src/police-stations/police-station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, Tourist, PoliceStation])],
  providers: [AlertsGateway, AlertsService],
  exports: [AlertsService, AlertsGateway],
})
export class AlertsModule {}
