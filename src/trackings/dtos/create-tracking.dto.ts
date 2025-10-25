import { IsString, IsNotEmpty, IsIn, IsObject } from 'class-validator';
import { TrackingData } from '../entities/tracking.entity';

const eventNames = ['page_view', 'time_on_page', 'scroll_depth', 'blog_completed', 'drop_position'];

export class CreateTrackingDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(eventNames)
  eventName: (typeof eventNames)[number];

  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsObject()
  @IsNotEmpty()
  data: TrackingData;
}

