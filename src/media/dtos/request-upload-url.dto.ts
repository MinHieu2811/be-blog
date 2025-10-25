import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class RequestUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[^\\/:*?"<>|]+$/)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ])
  contentType!: string;
}

