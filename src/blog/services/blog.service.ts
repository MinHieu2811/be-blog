import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from '../dtos/create-blog.dto';
import { UpdateBlogDto } from '../dtos/update-blog.dto';
import { Blog } from '../entities/blog.entity';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBService } from './dynamo.service';
import { MediaService } from '../../media/services/media.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly mediaService: MediaService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove non-word chars
      .replace(/[\s_-]+/g, '-') // collapse whitespace and replace by -
      .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
  }

  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    const { title, author, excerpt, tags, status, coverImage, content } = createBlogDto;
    const postId = uuidv4();
    const slug = this.generateSlug(title);
    const now = new Date().toISOString();
    const finalizedContent = await this.mediaService.finalizeContent(content ?? '', postId);

    const newPost: Blog = {
      postId,
      slug,
      title,
      author,
      excerpt,
      content: finalizedContent,
      tags: tags || [],
      status: status || 'draft',
      coverImage: coverImage || '',
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : undefined,
      likeCount: 0,
      viewCount: 0,
      hasUnpublishedChanges: false,
    };

    return this.dynamoDBService.createPost(newPost);
  }

  async findAll(): Promise<Blog[]> {
    return this.dynamoDBService.getAllPosts();
  }

  async findOne(id: string): Promise<Blog> {
    const post = await this.dynamoDBService.getPost(id);
    if (!post) {
      throw new NotFoundException(`Blog post with ID "${id}" not found`);
    }
    return post;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const { title, status, content } = updateBlogDto;
    await this.findOne(id);

    const dataToUpdate: Partial<Blog> = { ...updateBlogDto };
    dataToUpdate.updatedAt = new Date().toISOString();

    if (title) {
      dataToUpdate.slug = this.generateSlug(title);
    }

    if (status === 'published') {
      const existingPost = await this.findOne(id);
      if (!existingPost.publishedAt) {
        dataToUpdate.publishedAt = new Date().toISOString();
      }
    }

    if (content !== undefined) {
      dataToUpdate.content = await this.mediaService.finalizeContent(content, id);
    }

    return this.dynamoDBService.updatePost(id, dataToUpdate);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.dynamoDBService.deletePost(id);
  }
}
