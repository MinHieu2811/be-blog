import { Injectable } from '@nestjs/common';
import { PresignedUpload, S3Service } from './s3.service';

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}

  async createStagingUploadUrl(fileName: string, contentType: string): Promise<PresignedUpload> {
    return this.s3Service.getStagingUploadUrl(fileName, contentType);
  }

  async finalizeContent(content: string, blogId: string): Promise<string> {
    return this.s3Service.finalizeBlogMedia(content, blogId);
  }

  async deleteStagingObject(key: string): Promise<void> {
    await this.s3Service.deleteStagingObject(key);
  }
}

