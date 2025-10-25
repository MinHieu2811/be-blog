import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly contentBucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.contentBucket = this.configService.get<string>('S3_CONTENT_BUCKET') || '';
  }

  async uploadContent(content: string, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.contentBucket,
      Key: key,
      Body: content,
      ContentType: 'text/markdown',
    });

    await this.s3.send(command);
    return key;
  }

  async deleteContent(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.contentBucket,
      Key: key,
    });
    await this.s3.send(command);
  }
}
