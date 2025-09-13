import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { PanicService } from './panic.service';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

// DTO for validating the incoming panic request body
export class PanicDto {
  @IsString()
  @IsNotEmpty()
  touristId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

@Controller('panic')
export class PanicController {
  constructor(private readonly panicService: PanicService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async triggerPanic(@Body() dto: PanicDto) {
    return this.panicService.triggerPanic(dto.touristId, dto.lat, dto.lng);
  }
}
