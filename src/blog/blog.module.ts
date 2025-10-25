import { Module } from '@nestjs/common';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { DynamoDBService } from './services/dynamo.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [BlogController],
  providers: [BlogService, DynamoDBService],
})
export class BlogModule {}

