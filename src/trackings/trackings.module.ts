import { Module } from '@nestjs/common';
import { TrackingsController } from './controllers/trackings.controller';
import { TrackingsService } from './services/trackings.service';
import { SqsService } from './services/sqs.service';

@Module({
  controllers: [TrackingsController],
  providers: [TrackingsService, SqsService],
})
export class TrackingsModule {}
