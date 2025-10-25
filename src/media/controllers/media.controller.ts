import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MediaService } from '../services/media.service';
import { RequestUploadUrlDto } from '../dtos/request-upload-url.dto';

@Controller('api/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getUploadUrl(@Body() body: RequestUploadUrlDto) {
    this.logger.log(`Generating upload URL for ${body.fileName}`);
    return this.mediaService.createStagingUploadUrl(body.fileName, body.contentType);
  }

  @Delete('staging')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStagingObject(@Query('key') key: string): Promise<void> {
    if (!key) {
      return;
    }
    this.logger.log(`Deleting staging object ${key}`);
    await this.mediaService.deleteStagingObject(key);
  }
}

