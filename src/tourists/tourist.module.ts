import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tourist } from './tourist.entity';
import { TouristsService } from './tourist.service';
import { TouristsController } from './tourist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tourist])],
  providers: [TouristsService],
  controllers: [TouristsController],
  exports: [TouristsService],
})
export class TouristsModule {}