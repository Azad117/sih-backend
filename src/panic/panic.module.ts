import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PanicController } from './panic.controller'
import { PanicService } from './panic.service'
import { Tourist } from '../tourists/tourist.entity';
import { Alert } from '../alerts/alerts.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { PoliceStationsModule } from '../police-stations/police-station.module'; // Import the new module

@Module({
  imports: [
    TypeOrmModule.forFeature([Tourist, Alert]),
    AlertsModule,
    PoliceStationsModule, // Add the module here
  ],
  controllers: [PanicController],
  providers: [PanicService],
})
export class PanicModule {}

