import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskZone } from './risk-zone.entity';
import { RiskZonesService } from './risk-zone.service';
import { RiskZonesController } from './risk-zone.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RiskZone])],
  providers: [RiskZonesService],
  controllers: [RiskZonesController],
  exports: [RiskZonesService],
})
export class RiskZonesModule {}
