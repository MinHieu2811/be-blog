import { Module } from '@nestjs/common';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { DynamoDBService } from './services/dynamo.service';
import { MediaModule } from '../media/media.module';
import { SqsService } from './services/sqs.service';

@Module({
  imports: [MediaModule],
  controllers: [BlogController],
  providers: [BlogService, DynamoDBService, SqsService],
})
export class BlogModule {}
