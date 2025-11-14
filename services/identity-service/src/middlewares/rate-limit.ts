import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { redis } from '../config/redis';
import { AppError } from '../utils/app-error';
import { getTenantIdFromHeaders } from '../utils/tenant';

const RATE_LIMIT_PREFIX = 'illajwala:rate-limit';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

const defaultKeyGenerator = (req: Request): string => {
  const tenantId = getTenantIdFromHeaders(req);
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.path;
  return `${RATE_LIMIT_PREFIX}:${tenantId || 'global'}:${path}:${ip}`;
};

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();

      // Get current count
      const count = await redis.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= maxRequests) {
        const ttl = await redis.ttl(key);
        const retryAfter = ttl > 0 ? ttl : Math.ceil(windowMs / 1000);

        res.setHeader('Retry-After', String(retryAfter));
        res.setHeader('X-RateLimit-Limit', String(maxRequests));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

        throw AppError.from({
          statusCode: StatusCodes.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        });
      }

      // Set headers
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentCount - 1)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

      // Track response to conditionally increment
      const originalSend = res.send.bind(res);
      res.send = function (body) {
        const statusCode = res.statusCode;

        // Only increment if we should track this response
        const shouldIncrement =
          (!skipSuccessfulRequests && statusCode < 400) ||
          (!skipFailedRequests && statusCode >= 400);

        if (shouldIncrement) {
          // Increment counter
          void redis
            .multi()
            .incr(key)
            .expire(key, Math.ceil(windowMs / 1000))
            .exec();
        }

        return originalSend(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Pre-configured rate limiters
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});

export const moderateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

export const lenientRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// Login rate limiter: 5 attempts per 15 minutes
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.path;
    return `${RATE_LIMIT_PREFIX}:login:${path}:${ip}`;
  },
  skipSuccessfulRequests: true, // Only count failed login attempts
});

// Payment rate limiter: 10 requests per minute
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req: Request) => {
    const tenantId = getTenantIdFromHeaders(req);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${RATE_LIMIT_PREFIX}:payment:${tenantId || 'global'}:${ip}`;
  },
});

// API rate limiter: 100 requests per minute per IP
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});
