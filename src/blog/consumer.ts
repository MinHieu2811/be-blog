import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DynamoDBService } from './services/dynamo.service';
import { SQSEvent } from 'aws-lambda';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dynamoDBService = app.get(DynamoDBService);

  return async (event: SQSEvent) => {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { slug, sessionId } = body;

      const blogLike = await dynamoDBService.getBlogLike(slug, sessionId);

      if (blogLike && blogLike.count >= 10) {
        console.log(`User ${sessionId} has already liked post ${slug} 10 times.`);
        continue;
      }

      const newCount = blogLike ? blogLike.count + 1 : 1;
      await dynamoDBService.updateBlogLike({
        slug,
        sessionId,
        count: newCount,
      });

      await dynamoDBService.incrementBlogLikes(slug);

      console.log(`Successfully processed like for post ${slug} from user ${sessionId}`);
    }
  };
}

export const handler = bootstrap();
