import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Tracking } from '../entities/tracking.entity';

@Injectable()
export class TrackingDynamoDBService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('APP_AWS_REGION'),
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('TRACKING_DB_TABLE') || 'Tracking';
  }

  async createTracking(tracking: Tracking): Promise<Tracking> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: tracking,
    });
    await this.docClient.send(command);
    return tracking;
  }
}
