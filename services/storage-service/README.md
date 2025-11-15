# Storage Service

Storage service for handling file uploads and Cloudflare R2 integration in the Illajwala platform.

## Overview

This service handles:

- File uploads via presigned URLs
- Cloudflare R2 integration
- File metadata management
- File deletion and access control

## Port

Default port: `4005`

## Environment Variables

See `env.sample` for required environment variables.

## API Endpoints

### Storage

- `POST /api/files/presigned-url` - Generate presigned URL for file upload
- `POST /api/files/:fileId/confirm` - Confirm file upload after client uploads to R2
- `GET /api/files/:fileId` - Get file details and download URL
- `GET /api/files` - List files with filters
- `DELETE /api/files/:fileId` - Delete file

## Health Checks

- `GET /health` - General health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /metrics` - Prometheus metrics

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## File Upload Flow

1. Client requests presigned URL from `/api/files/presigned-url`
2. Service generates presigned URL and creates file record with "uploading" status
3. Client uploads file directly to R2 using presigned URL
4. Client confirms upload via `/api/files/:fileId/confirm` with file size
5. Service updates file record to "uploaded" status and generates public URL
