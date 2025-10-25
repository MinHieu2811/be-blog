import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Blog } from '../entities/blog.entity';

@Injectable()
export class DynamoDBService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('DB_TABLE') || '';
  }

  async createPost(post: Blog): Promise<Blog> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: post,
    });
    await this.docClient.send(command);
    return post;
  }

  async getAllPosts(): Promise<Blog[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });
    const { Items } = await this.docClient.send(command);
    return Items as Blog[];
  }

  async getPost(postId: string): Promise<Blog> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { postId },
    });
    const { Item } = await this.docClient.send(command);
    return Item as Blog;
  }

  async updatePost(postId: string, data: Partial<Blog>): Promise<any> {
    const updateExpressionParts = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, any> = {};

    for (const key in data) {
      if (data.hasOwnProperty(key) && key !== 'postId') {
        const attrKey = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressionParts.push(`${attrKey} = ${attrValue}`);
        expressionAttributeNames[attrKey] = key;
        expressionAttributeValues[attrValue] = data[key as keyof Blog];
      }
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { postId },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const { Attributes } = await this.docClient.send(command);
    return Attributes;
  }

  async deletePost(postId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { postId },
    });
    await this.docClient.send(command);
  }
}
