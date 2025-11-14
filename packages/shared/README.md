# @illajwala/shared

Shared utilities, middlewares, and config helpers for Illajwala backend services.

## Overview

This package contains common code used across all backend services to avoid duplication and ensure consistency. It includes:

- **Utilities**: Error handling, API responses, async wrappers, tenant utilities, JWT utilities, logging
- **Middlewares**: Authentication, error handling, request validation, rate limiting, caching, input sanitization

## Installation

This package is part of the monorepo workspace. Services should add it as a dependency:

```json
{
  "dependencies": {
    "@illajwala/shared": "workspace:*"
  }
}
```

## Usage

### Setting Up Middlewares

Create a `middlewares/index.ts` file in your service to initialize middlewares with dependencies:

```typescript
import { redis } from '../config/redis';
import { isProd, env } from '../config/env';
import {
  createLogger,
  createErrorHandler,
  createRequestLogger,
  createJwtUtils,
  createRequireAuth,
  createRateLimit,
  createPreconfiguredRateLimiters,
  createCache,
  sanitizeInput,
  notFoundHandler,
  validateRequest,
} from '@illajwala/shared';

// Initialize logger
export const logger = createLogger({ isProd });

// Initialize error handler
export const errorHandler = createErrorHandler({ logger, isProd });

// Initialize request logger
export const requestLogger = createRequestLogger({ logger });

// Initialize JWT utils
const jwtUtils = createJwtUtils({
  accessTokenSecret: env.JWT_SECRET,
  refreshTokenSecret: env.REFRESH_JWT_SECRET,
  accessTokenExpiry: env.JWT_EXPIRY,
  refreshTokenExpiry: env.REFRESH_JWT_EXPIRY,
});

// Initialize auth middleware
export const requireAuth = createRequireAuth({
  verifyAccessToken: jwtUtils.verifyAccessToken,
});

// Initialize rate limiters
export const rateLimit = createRateLimit({ redis });
export const { apiRateLimit, paymentRateLimit, loginRateLimit } = createPreconfiguredRateLimiters({
  redis,
});

// Initialize cache middleware
export const cache = createCache({ redis });

// Export simple middlewares (no dependencies)
export { sanitizeInput, validateRequest, notFoundHandler };
```

### Setting Up Utilities

Create a `utils/index.ts` file to re-export utilities:

```typescript
export {
  AppError,
  successResponse,
  paginateResponse,
  catchAsync,
  getTenantIdFromHeaders,
  resolveTenantId,
  requireTenantId,
  TENANT_HEADER,
} from '@illajwala/shared';

export type { AuthenticatedRequest } from '@illajwala/shared';
```

### Using in Routes

```typescript
import { Router } from 'express';
import { requireAuth, validateRequest, apiRateLimit } from '../middlewares';
import { catchAsync, successResponse } from '../utils';
import { z } from 'zod';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

router.post(
  '/',
  requireAuth(['admin']),
  apiRateLimit,
  validateRequest({ body: createSchema }),
  catchAsync(async (req, res) => {
    // Your handler logic
    res.json(successResponse({ id: '123' }, 'Created successfully'));
  }),
);
```

## API Reference

### Utilities

- `AppError`: Custom error class for operational errors
- `successResponse<T>(data, message?)`: Standard success response format
- `paginateResponse<T>(items, total, page, pageSize)`: Paginated response format
- `catchAsync(handler)`: Wrapper for async route handlers
- `getTenantIdFromHeaders(req)`: Extract tenant ID from request headers
- `resolveTenantId(req, options?)`: Resolve tenant ID from token or headers
- `requireTenantId(req, options?)`: Require tenant ID (throws if missing)
- `createLogger(config?)`: Create a logger instance
- `createJwtUtils(config)`: Create JWT utility functions

### Middlewares

- `createErrorHandler(config)`: Error handling middleware factory
- `createRequestLogger(config)`: Request logging middleware factory
- `createRequireAuth(config)`: Authentication middleware factory
- `createRateLimit(config)`: Rate limiting middleware factory
- `createPreconfiguredRateLimiters(config)`: Pre-configured rate limiters
- `createCache(config)`: Caching middleware factory
- `sanitizeInput`: Input sanitization middleware
- `validateRequest(schemas)`: Request validation middleware
- `notFoundHandler`: 404 handler middleware

## Development

Build the package:

```bash
pnpm --filter @illajwala/shared build
```

Watch mode:

```bash
pnpm --filter @illajwala/shared dev
```
