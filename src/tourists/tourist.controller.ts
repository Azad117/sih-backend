import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { TouristsService } from './tourist.service';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

// --- Data Transfer Object (DTO) for creating a tourist ---
// This class defines the structure and validation rules for the incoming request body.
export class CreateTouristDto {
  @IsString()
  @IsNotEmpty()
  touristId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;
}


@Controller('tourists')
export class TouristsController {
  constructor(private readonly svc: TouristsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  /**
   * UPDATED: This method now uses the CreateTouristDto and a ValidationPipe.
   * NestJS will automatically validate the incoming body against the rules in the DTO.
   * If validation fails, it will automatically return a 400 Bad Request error.
   */
  @Post()
  @UsePipes(new ValidationPipe()) // Activates automatic validation
  async create(@Body() dto: CreateTouristDto) {
    // The DTO has been validated, so we know the data is in the correct format.
    // We still need to convert the date strings to Date objects.
    return this.svc.create({
      ...dto,
      validFrom: new Date(dto.validFrom),
      validTo: new Date(dto.validTo),
    });
  }

  @Get(':touristId')
  findById(@Param('touristId') touristId: string) {
    return this.svc.findByTouristId(touristId);
  }
}
