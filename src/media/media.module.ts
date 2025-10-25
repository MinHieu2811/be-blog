import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { S3Service } from './services/s3.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, S3Service],
  exports: [MediaService],
})
export class MediaModule {}
