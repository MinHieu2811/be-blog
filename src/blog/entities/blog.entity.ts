export class Blog {
  postId: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  publishedAt?: string; // ISO8601
  author: string;
  tags: string[];
  excerpt: string;
  content?: string;
  coverImage?: string;
  likeCount: number;
  viewCount: number;
  lastBuildId?: string;
  hasUnpublishedChanges: boolean;
}
