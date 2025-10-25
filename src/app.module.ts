import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from './blog/blog.module';
import { ConfigModule } from '@nestjs/config';
import { TrackingsModule } from './trackings/trackings.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BlogModule,
    MediaModule,
    TrackingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
