import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Query,
  ParseFloatPipe,
  ParseIntPipe, // Import the pipe
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PoliceStationsService } from './police-station.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { PoliceStation } from './police-station.entity';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePoliceStationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  @IsOptional()
  jurisdictionRadius?: number;
}

@Controller('police-stations')
export class PoliceStationsController {
  constructor(
    private readonly svc: PoliceStationsService,
    @InjectRepository(Tourist)
    private touristRepo: Repository<Tourist>,
    @InjectRepository(PoliceStation)
    private stationRepo: Repository<PoliceStation>,
  ) {}

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ) {
    return this.svc.findNearby(lat, lng);
  }

  @Get()
  all() {
    return this.svc.findAll();
  }

  /**
   * --- FIXED ---
   * Now uses ParseIntPipe to automatically validate that the 'id'
   * from the URL is a valid integer before it reaches the service.
   * If not, it will automatically return a 400 Bad Request.
   */
  @Get(':id')
  one(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findById(id);
  }

  /**
   * Finds all tourists for whom this station is the single nearest one.
   * Also uses ParseIntPipe for robust validation.
   */
  @Get(':id/tourists')
  async touristsInJurisdiction(@Param('id', ParseIntPipe) id: number): Promise<Tourist[]> {
    const station = await this.stationRepo.findOneBy({ id });
    if (!station) {
      throw new NotFoundException('Police station not found.');
    }

    return this.touristRepo
      .createQueryBuilder('tourist')
      .where(
        `(
          SELECT ps.id
          FROM police_stations ps
          ORDER BY ST_Distance(ps.location, tourist.location) ASC
          LIMIT 1
        ) = :stationId`,
        { stationId: id },
      )
      .getMany();
  }

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreatePoliceStationDto) {
    const createPayload = {
      name: dto.name,
      jurisdictionRadius: dto.jurisdictionRadius,
      location: {
        type: 'Point' as const,
        coordinates: [dto.lng, dto.lat],
      },
    };
    return this.svc.create(createPayload);
  }
}

