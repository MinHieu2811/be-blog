import { Module } from '@nestjs/common';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { S3Service } from './services/s3.service';
import { DynamoDBService } from './services/dynamo.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, S3Service, DynamoDBService],
})
export class BlogModule {}
