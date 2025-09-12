import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { Tourist } from '../tourists/tourist.entity';
import { RiskZone } from '../risk-zones/risk-zone.entity';
import { Alert } from '../alerts/alerts.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { PoliceStation } from 'src/police-stations/police-station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Tourist, RiskZone, Alert, PoliceStation]), AlertsModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
