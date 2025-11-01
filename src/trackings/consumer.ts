import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TrackingDynamoDBService } from './services/dynamo.service';
import { SQSEvent } from 'aws-lambda';
import { INestApplicationContext } from '@nestjs/common';

let app: INestApplicationContext;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.createApplicationContext(AppModule);
  }
  return app;
}

export const handler = async (event: SQSEvent) => {
  const nestApp = await bootstrap();
  const dynamoDBService = nestApp.get(TrackingDynamoDBService);

  console.log('--- Tracking consumer handler started ---');
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    console.log('Processing record with ID:', record.messageId);
    try {
      console.log('Parsing record body...');
      const trackingData = JSON.parse(record.body);
      console.log('Parsed tracking data:', JSON.stringify(trackingData, null, 2));

      console.log('Attempting to save to DynamoDB...');
      await dynamoDBService.createTracking(trackingData);
      console.log('Successfully saved record to DynamoDB:', record.messageId);
    } catch (error) {
      console.error('Error processing SQS record:', record.messageId);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
  console.log('--- Tracking consumer handler finished ---');
};
