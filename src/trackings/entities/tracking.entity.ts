type EventName = 'page_view' | 'time_on_page' | 'scroll_depth' | 'blog_completed' | 'drop_position';

export interface Tracking {
  sessionId: string;
  eventName: EventName;
  timestamp: string;
  data: TrackingData;
}

export interface TrackingData {
  [key: string]: any;
}
