import { Injectable } from '@nestjs/common';
import { CreateTrackingDto } from '../dtos/create-tracking.dto';
import { SqsService } from './sqs.service';

@Injectable()
export class TrackingsService {
  constructor(private readonly sqsService: SqsService) {}

  async create(createTrackingDto: CreateTrackingDto): Promise<void> {
    await this.sqsService.sendMessage(createTrackingDto);
  }
}
