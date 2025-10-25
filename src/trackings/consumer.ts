import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TrackingDynamoDBService } from './services/dynamo.service';
import { SQSEvent } from 'aws-lambda';
import { Tracking } from './entities/tracking.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dynamoDBService = app.get(TrackingDynamoDBService);

  return async (event: SQSEvent) => {
    for (const record of event.Records) {
      try {
        const trackingData: Tracking = JSON.parse(record.body);
        await dynamoDBService.createTracking(trackingData);
      } catch (error) {
        console.error('Error processing SQS record:', error);
        // Depending on the error, you might want to handle it differently
        // e.g., move to a Dead Letter Queue (DLQ)
      }
    }
  };
}

export const handler = bootstrap();

