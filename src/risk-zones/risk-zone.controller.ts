import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RiskZonesService } from './risk-zone.service';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

// --- Data Transfer Object (DTO) for creating a Risk Zone ---
// This class defines the shape and validation rules for the request body.
export class CreateRiskZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  @IsPositive() // Ensures the radius is a positive number
  radius: number;
}

@Controller('risk-zones')
export class RiskZonesController {
  constructor(private readonly svc: RiskZonesService) {}

  /**
   * Returns a list of all risk zones.
   */
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  /**
   * Finds a single risk zone by its ID.
   * @param id The ID of the risk zone, parsed from the URL.
   */
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    // ParseIntPipe automatically converts the URL parameter to a number
    // and throws an error if it's not a valid integer.
    return this.svc.findById(id);
  }

  /**
   * Creates a new risk zone.
   * It uses the CreateRiskZoneDto and a ValidationPipe to automatically
   * validate the incoming JSON body.
   */
  @Post()
  @UsePipes(new ValidationPipe()) // Activates automatic validation
  create(@Body() dto: CreateRiskZoneDto) {
    return this.svc.create(dto);
  }

  /**
   * Deletes a risk zone by its ID.
   * @param id The ID of the risk zone to delete.
   */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }
}