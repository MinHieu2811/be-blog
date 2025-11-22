import { SQS } from 'aws-sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  private readonly sqs = new SQS();
  private readonly queueUrl = process.env.BLOG_LIKES_QUEUE_URL;

  async sendLikeMessage(message: { slug: string; sessionId: string }) {
    if (!this.queueUrl) {
      throw new Error('BLOG_LIKES_QUEUE_URL is not set');
    }

    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    };

    return this.sqs.sendMessage(params).promise();
  }
}

