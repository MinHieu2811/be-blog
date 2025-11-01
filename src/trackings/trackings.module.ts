import { Module } from '@nestjs/common';
import { TrackingsController } from './controllers/trackings.controller';
import { TrackingsService } from './services/trackings.service';
import { SqsService } from './services/sqs.service';
import { TrackingDynamoDBService } from './services/dynamo.service';

@Module({
  controllers: [TrackingsController],
  providers: [TrackingsService, SqsService, TrackingDynamoDBService],
  exports: [TrackingDynamoDBService],
})
export class TrackingsModule {}
