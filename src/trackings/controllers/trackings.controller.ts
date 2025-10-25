import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TrackingsService } from '../services/trackings.service';
import { CreateTrackingDto } from '../dtos/create-tracking.dto';

@Controller('api/trackings')
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createTrackingDto: CreateTrackingDto) {
    this.trackingsService.create(createTrackingDto);
  }
}
