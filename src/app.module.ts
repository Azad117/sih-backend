import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TouristsModule } from './tourists/tourist.module';
import { LocationsModule } from './locations/locations.module';
import { AlertsModule } from './alerts/alerts.module';
import { DatabaseModule } from './database/database.module';
import { RiskZonesModule } from './risk-zones/risk-zone.module';
import { PoliceStationsModule } from './police-stations/police-station.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TouristsModule,
    LocationsModule,
    AlertsModule,
    DatabaseModule,
    RiskZonesModule,
    PoliceStationsModule
  ],
})
export class AppModule {}
