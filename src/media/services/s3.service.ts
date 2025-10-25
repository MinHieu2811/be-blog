import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly cloudfrontDomain: string;
  private readonly stagingPrefix = 'staging';
  private readonly blogPrefix = 'blogs';
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    this.bucketName = this.configService.get<string>('S3_MEDIA_BUCKET') ?? '';
    this.cloudfrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN') ?? '';
    this.s3 = new S3Client({ region });
  }

  async deleteContent(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3.send(command);
  }

  async getStagingUploadUrl(fileName: string, contentType: string): Promise<PresignedUpload> {
    const trimmedFileName = fileName.trim();
    const uniqueId = uuidv4();
    const key = `${this.stagingPrefix}/${uniqueId}/${trimmedFileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, putCommand, {
      expiresIn: 15 * 60,
    });

    const publicUrl = this.buildPublicUrl(key);

    return { uploadUrl, publicUrl, key };
  }

  async deleteStagingObject(key: string): Promise<void> {
    if (!key.startsWith(`${this.stagingPrefix}/`)) {
      this.logger.warn(`Attempted to delete non-staging key: ${key}`);
      return;
    }
    await this.deleteContent(key);
  }

  async finalizeBlogMedia(content: string, blogId: string): Promise<string> {
    const stagingUrls = this.extractStagingUrls(content);
    if (stagingUrls.length === 0) {
      return content;
    }

    let updatedContent = content;

    for (const stagingUrl of stagingUrls) {
      try {
        const { sourceKey, fileName } = this.parseStagingUrl(stagingUrl);
        const destinationKey = this.buildBlogKey(blogId, fileName);

        await this.copyObject(sourceKey, destinationKey);
        await this.deleteContent(sourceKey);

        const finalUrl = this.buildPublicUrl(destinationKey);
        updatedContent = updatedContent.replaceAll(stagingUrl, finalUrl);
      } catch (error) {
        this.logger.error(
          `Failed to finalize media from staging URL ${stagingUrl}: ${(error as Error).message}`,
        );
      }
    }

    return updatedContent;
  }

  private buildPublicUrl(key: string): string {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  private extractStagingUrls(content: string): string[] {
    const regex = new RegExp(`https?://[^\s)]+/${this.stagingPrefix}/[\w-]+/[^)\s]+`, 'g');
    return content.match(regex) ?? [];
  }

  private parseStagingUrl(url: string): { sourceKey: string; fileName: string } {
    const urlObject = new URL(url);
    const sourceKey = urlObject.pathname.replace(/^\//, '');

    if (!sourceKey.startsWith(`${this.stagingPrefix}/`)) {
      throw new Error(`Invalid staging URL: ${url}`);
    }

    const segments = sourceKey.split('/');
    const fileName = segments.at(-1);

    if (!fileName) {
      throw new Error(`Cannot extract file name from staging URL: ${url}`);
    }

    return { sourceKey, fileName };
  }

  private buildBlogKey(blogId: string, fileName: string): string {
    return `${this.blogPrefix}/${blogId}/${fileName}`;
  }

  private async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
      MetadataDirective: 'COPY',
    });
    await this.s3.send(copyCommand);
  }
}
