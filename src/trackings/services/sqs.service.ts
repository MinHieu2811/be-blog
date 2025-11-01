import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('APP_AWS_REGION'),
    });
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || '';
  }

  async sendMessage(messageBody: object): Promise<void> {
    console.log(`Attempting to send message to SQS Queue URL: ${this.queueUrl}`);

    if (!this.queueUrl) {
      console.error('SQS_QUEUE_URL is not configured. Message will not be sent.');
      return;
    }

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });

    try {
      await this.sqsClient.send(command);
      console.log('Successfully sent message to SQS.');
    } catch (error) {
      console.error('Failed to send message to SQS.');
      console.error('Error details:', JSON.stringify(error, null, 2));
      // In a real-world scenario, you might want to re-throw or handle this error
      // But for debugging, logging it is the most important step.
    }
  }
}
