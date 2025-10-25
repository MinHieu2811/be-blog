# API Coding Standards for NestJS Backend Project

## Introduction
This document defines standards for developing APIs in the NestJS backend project. Focus on RESTful design, security, and performance for the blog management endpoints.


## General API Design
- Base Path: /api (e.g., /api/blogs).
- HTTP Methods: Follow REST: POST for create, GET for read, PATCH for update, DELETE for delete.
- Versioning: Use URL versioning if needed (e.g., /api/v1/blogs). Start with no version.
- Response Format: JSON. Standard structure
```
{
  "data": {...},
  "meta": {"timestamp": "2025-09-28T00:00:00Z"}
}
```
- Error Responses: Use HTTP status codes (e.g., 400 Bad Request). Include error message:
```
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "Bad Request"
}
```

## Endpoint Standards
- Naming: Resource-based (e.g., /blogs/:id instead of /getBlogById).
- Pagination: For lists (e.g., GET /blogs?limit=10&offset=0).
- Validation: Use Pipe validation in controllers (e.g., @UsePipes(ValidationPipe)).
- Documentation: Use Swagger (via @nestjs/swagger). Add @ApiTags, @ApiResponse.
- Rate Limiting: Implement if traffic increases (using @nestjs/throttler).

## Specific to Blog APIs

### CRUD Endpoints:

- POST /api/blogs: Create post (multipart for media).
- PATCH /api/blogs/:id: Update post.
- DELETE /api/blogs/:id: Delete post.
- PATCH /api/blogs/:id/publish: Set to published.
- PATCH /api/blogs/:id/draft: Set to draft.


### Integration with AWS:

- Use services for DynamoDB (Prisma) and S3 uploads.
- Trigger ISR revalidation on publish/delete (e.g., via HTTP call to Next.js webhook).

### Security: 
- Since single-user, rely on AWS API Gateway auth if exposed. No app-level auth.

## Performance

- Caching: Use in-memory cache for frequent reads if needed.
- Async Operations: All I/O (DB, S3) should be async.
- Logging: Log requests/responses with Winston.

## Testing

- Unit test controllers/services.
- E2E test APIs with Supertest.

These standards ensure robust, maintainable APIs.