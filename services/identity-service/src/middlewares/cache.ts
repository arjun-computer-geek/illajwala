import type { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { getTenantIdFromHeaders } from "../utils/tenant";

const CACHE_PREFIX = "illajwala:cache";

interface CacheOptions {
  ttlSeconds?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipCache?: (req: Request) => boolean; // Skip caching for certain requests
}

const defaultKeyGenerator = (req: Request): string => {
  const tenantId = getTenantIdFromHeaders(req);
  const path = req.path;
  const query = req.query ? JSON.stringify(req.query) : "";
  return `${CACHE_PREFIX}:${tenantId || "global"}:${path}:${query}`;
};

export const cache = (options: CacheOptions = {}) => {
  const { ttlSeconds = 300, keyGenerator = defaultKeyGenerator, skipCache } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip if skipCache returns true
    if (skipCache && skipCache(req)) {
      return next();
    }

    try {
      const key = keyGenerator(req);

      // Try to get from cache
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader("X-Cache", "HIT");
        return res.json(data);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void redis.setex(key, ttlSeconds, JSON.stringify(body));
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (error) {
      // If caching fails, continue without cache
      next();
    }
  };
};

