import { Controller, Post, Body, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsISO8601 } from 'class-validator';

// --- Data Transfer Object (DTO) for incoming location updates ---
// This class defines the expected shape and validation rules for the request body.
export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  touristId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsISO8601() // Ensures the timestamp is a valid ISO 8601 date string
  timestamp?: string;
}


@Controller('locations')
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  /**
   * Receives a location update for a tourist.
   * The @Body() decorator now uses the UpdateLocationDto.
   * The @UsePipes(new ValidationPipe()) decorator automatically validates
   * the incoming body against the rules defined in the DTO.
   */
  @Post('update')
  @UsePipes(new ValidationPipe()) // Enable automatic validation for this endpoint
  async update(@Body() dto: UpdateLocationDto) {
    // The DTO is passed directly to the service, which is already designed to handle it.
    return this.svc.processLocation(dto);
  }

  /**
   * Returns the latest known position for all active tourists.
   * No changes are needed here as it doesn't process an incoming body.
   */
  @Get('latest')
  async latest() {
    return this.svc.getLatestTouristPositions();
  }
}

