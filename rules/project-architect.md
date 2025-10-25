# Architecture Document for Personal Blog Backend API

## Version History
- **Version**: 1.0
- **Date**: September 28, 2025
- **Author**: Grok (Assisted Architecture Design)
- **Purpose**: This document outlines the high-level and detailed architecture for a backend application serving APIs for a personal blog system. The backend is built using Nest.js (as per previous discussions), deployed on AWS Lambda for serverless execution, and integrated with AWS services including DynamoDB for data storage, S3 for media and MDX content upload, CloudFront for content delivery, Amplify for frontend integration, and CloudWatch for monitoring. The focus is on APIs for creating, editing, deleting blogs, and managing publish/draft states.

## Overview
### System Goals
- Provide RESTful APIs for blog management (CRUD operations on blog posts).
- Support publish/draft workflows for posts.
- Integrate with AWS services for scalability, cost-efficiency (leveraging always free tiers where possible), and serverless architecture.
- Ensure low-latency content delivery via CDN.
- Monitor and log operations for debugging and performance tracking.
- Assumptions:
  - Blog posts are written in MDX format.
  - Traffic: Low to medium (personal blog), staying within AWS free tiers initially.

### High-Level Architecture Diagram (Text-Based)
```
[API Gateway] --> [Lambda: Nest.js Backend]
                  |
                  | (CRUD Operations)
                  v
[DynamoDB: Blog Metadata (title, status, etc.)]
                  |
                  | (Upload Media/MDX)
                  v
[S3: Storage for Images/Media & MDX Files]
                  |
                  | (Distribute Content)
                  v
[CloudFront: CDN for Fast Delivery]
                  |
                  | (Logs & Metrics)
                  v
[CloudWatch: Monitoring & Alerts]
```

- **Key Flows**:
  - **Create/Edit Blog**: Frontend sends data to API → Lambda processes → Updates DynamoDB metadata → Uploads MDX/content to S3.
  - **Publish/Draft**: Update status in DynamoDB → Trigger ISR revalidation in Next.js (via webhook or API).
  - **Delete**: Remove from DynamoDB and S3.
  - **Serve Content**: Next.js fetches metadata from DynamoDB via API, pulls MDX/media from S3/CloudFront.
  - **Tracking Event**: Next.js app push event through API, API load data into DynamoDB

### Technology Stack
- **Backend Framework**: Nest.js (TypeScript) for modular, scalable API development.
- **Deployment**: AWS Lambda (serverless) + API Gateway (for routing).
- **Database**: Amazon DynamoDB (NoSQL, serverless).
- **Storage**: Amazon S3 (object storage).
- **CDN**: Amazon CloudFront.
- **Hosting/Frontend Integration**: AWS Amplify (for Next.js deployment and CI/CD).
- **Monitoring**: Amazon CloudWatch.
- **Other Tools**: AWS SDK for Node.js (to interact with DynamoDB/S3), Serverless Framework or AWS SAM for deployment.

## Detailed Components

### 1. Backend Application (Nest.js on Lambda)
- **Structure**: Modular monolith with controllers, services, modules.
- **Deployment**:
  - Use Serverless Framework to package Nest.js app into Lambda functions.
  - Each API endpoint can be a separate Lambda or grouped (e.g., one Lambda for all blog APIs).
  - Cold start mitigation: Use Provisioned Concurrency if needed (low cost with credits).
- **Authentication**: Implement JWT guard (e.g., @nestjs/jwt). Integrate with AWS Cognito for user management (free tier: 50,000 MAUs).
- **Error Handling**: Global exception filters to log errors to CloudWatch.
- **Environment Variables**: Store AWS credentials/secrets in AWS Secrets Manager or Lambda env vars.

#### API Endpoints
All endpoints under `/api/blogs` base path. Use RESTful design with HTTP methods.

- **POST /api/blogs**
  - **Description**: Create a new blog post.
  - **Request Body** (JSON + Multipart for uploads):
    - `title`: string (required)
    - `content`: MDX string or file (uploaded to S3)
    - `media`: Array of files (images/videos, uploaded to S3)
    - `status`: 'draft' | 'published' (default: 'draft')
    - Other metadata: tags, author, etc.
  - **Flow**:
    1. Validate input (using @nestjs/class-validator).
    2. Upload MDX content to S3 (e.g., bucket: 'blog-mdx-bucket', key: `posts/${postId}.mdx`).
    3. Upload media to S3 (bucket: 'blog-media-bucket', generate public URLs).
    4. Generate unique postId (UUID).
    5. Save metadata to DynamoDB (table: 'BlogPosts').
    6. If published, trigger Next.js revalidation (e.g., call webhook to revalidatePath('/blog/[slug]')).
  - **Response**: 201 Created with post metadata.
  - **Integration**: AWS SDK `putObject` for S3, `putItem` for DynamoDB.

- **PATCH /api/blogs/:id**
  - **Description**: Edit an existing blog post.
  - **Request Body**: Similar to create, but partial updates.
  - **Flow**:
    1. Fetch existing post from DynamoDB (`getItem`).
    2. Update MDX/media in S3 (overwrite or add new).
    3. Update metadata in DynamoDB (`updateItem`).
    4. If status changes to 'published', trigger revalidation.
  - **Response**: 200 OK with updated post.

- **DELETE /api/blogs/:id**
  - **Description**: Delete a blog post.
  - **Flow**:
    1. Fetch post from DynamoDB.
    2. Delete associated objects from S3 (`deleteObject` for MDX and media).
    3. Delete item from DynamoDB (`deleteItem`).
    4. Trigger revalidation to remove from frontend cache.
  - **Response**: 204 No Content.

- **PATCH /api/blogs/:id/publish**
  - **Description**: Publish a draft post.
  - **Flow**:
    1. Update status to 'published' in DynamoDB.
    2. Trigger Next.js ISR revalidation.
  - **Response**: 200 OK.

- **PATCH /api/blogs/:id/draft**
  - **Description**: Move a published post to draft.
  - **Flow**:
    1. Update status to 'draft' in DynamoDB.
    2. Trigger revalidation to hide from public view.
  - **Response**: 200 OK.

- **Additional Endpoints** (Optional for completeness):
  - GET /api/blogs: List all posts (with filters: status, tags).
  - GET /api/blogs/:id: Get single post metadata (frontend uses this for ISR data fetching).

#### Services Layer
- **BlogService**: Handles business logic.
  - Methods: createPost, updatePost, deletePost, changeStatus.
  - Integrates with DynamoDBService and S3Service.

- **DynamoDBService**: Wrapper for AWS SDK.
  - Table Schema (BlogPosts):
    - Partition Key: postId (string)
    - Attributes:
      - title: string
      - status: string ('draft' | 'published')
      - mdxKey: string (S3 key for MDX file)
      - mediaUrls: array<string> (S3 URLs)
      - createdAt: number (timestamp)
      - updatedAt: number
      - slug: string (for URL)

- **S3Service**: Handles uploads/downloads.
  - Buckets:
    - blog-mdx-bucket: For MDX files (private, signed URLs for access).
    - blog-media-bucket: For images/media (public-read for direct serve via CloudFront).
  - Pre-signed URLs for uploads from frontend (secure direct upload).

### 2. Database (DynamoDB)
- **Table Design**: 2 tables 'BlogPosts' and 'Tracking'.
- **Indexing**: Global Secondary Index on 'status' for querying drafts/published.
- **Capacity**: On-demand (serverless, pay-per-request; free tier: 25 read/write units).
- **Backup**: Enable Point-in-Time Recovery (free for basic).

### 3. Storage (S3)
- **Buckets Configuration**:
  - Versioning enabled for MDX (to recover edits).
  - Lifecycle policies: Move old media to Glacier after 30 days (cost-saving).
  - Security: Bucket policies to allow Lambda access only.
- **Integration**: Use signed URLs for secure uploads from CMS frontend.

### 4. CDN (CloudFront)
- **Distribution**: Point to S3 buckets and Amplify origin.
- **Behaviors**: Cache MDX/media with long TTL; invalidate on publish/delete.
- **Integration**: Lambda@Edge for custom logic if needed (e.g., auth on private content).

### 5. Frontend Integration (Amplify)
- **Role**: Hosts Next.js, which calls backend APIs.
- **Webhooks**: Backend triggers Amplify rebuild or Next.js revalidation on publish.

### 6. Monitoring (CloudWatch)
- **Logs**: Stream from Lambda (Nest.js uses Winston logger).
- **Metrics**: Track API invocations, DynamoDB throughput, S3 requests.
- **Alarms**: Alert on high error rates or throttled requests (email/SNS).
- **Dashboards**: Custom dashboard for blog API performance.

## Deployment and CI/CD
- **Tools**: Serverless Framework for Lambda deployment; Amplify for frontend.
- **Pipeline**: GitHub Actions → Push code → Build/Deploy Lambda → Update API Gateway.
- **Testing**: Unit tests (Jest in Nest.js), integration tests with LocalStack (emulate AWS locally).

## Security Considerations
- IAM Roles: Least privilege (Lambda only accesses specific DynamoDB table/S3 buckets).
- Input Validation: Sanitize MDX to prevent XSS.
- Rate Limiting: API Gateway throttles.
- Data Encryption: S3/DynamoDB at rest (default).

## Scalability and Cost
- **Scalability**: All serverless; auto-scales with traffic.
- **Cost Estimate**: Free for low traffic (always free tiers). Scale-up: ~$0.01 per 1,000 API calls.
- **Optimization**: Use ISR to minimize backend calls.

## Risks and Mitigations
- **Cold Starts**: Warm-up Lambdas if traffic spikes.
- **Data Loss**: Backups in DynamoDB/S3.
- **Vendor Lock-in**: Abstract AWS SDK for portability.

## Setup Instructions

1. Install NestJS CLI: npm i -g @nestjs/cli.
2. Create project: nest new blog-backend.
3. Add dependencies: npm i @nestjs/config class-validator class-transformer uuid winston @aws-sdk/client-s3 @aws-sdk/client-dynamodb prisma @prisma/client serverless serverless-offline esbuild.
4. Init Prisma: npx prisma init --datasource-provider dynamodb.
5. Generate Prisma client: npx prisma generate.
6. Install Serverless: npm i -g serverless.
7. Deploy: Run scripts/deploy.sh or serverless deploy.
8. Local Testing: Use serverless offline to simulate Lambda/API Gateway locally.