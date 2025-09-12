import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliceStation } from './police-station.entity';
import { PoliceStationsService } from './police-station.service';
import { PoliceStationsController } from './police-station.controller';
import { Tourist } from 'src/tourists/tourist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PoliceStation,Tourist])],
  providers: [PoliceStationsService],
  controllers: [PoliceStationsController],
  exports: [PoliceStationsService],
})
export class PoliceStationsModule {}
