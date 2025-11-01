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
  async create(@Body() createTrackingDto: CreateTrackingDto) {
    // We MUST await this in a Lambda environment to prevent early exit.
    // The call to SQS is very fast, so this won't add much latency.
    await this.trackingsService.create(createTrackingDto);
  }
}
