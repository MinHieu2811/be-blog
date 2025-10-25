import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from './blog/blog.module';
import { ConfigModule } from '@nestjs/config';
import { TrackingsModule } from './trackings/trackings.module';
import { TrackingDynamoDBService } from './trackings/services/dynamo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BlogModule,
    TrackingsModule,
  ],
  controllers: [AppController],
  providers: [AppService, TrackingDynamoDBService],
})
export class AppModule {}
