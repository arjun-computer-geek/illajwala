import { redis } from '../config/redis';
import { isProd, env } from '../config/env';
import {
  createLogger,
  createErrorHandler,
  createRequestLogger,
  createJwtUtils,
  createRateLimit,
  createPreconfiguredRateLimiters,
  createCache,
  createRequireAuth,
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
  refreshTokenSecret: env.REFRESH_JWT_SECRET || 'dev-refresh-secret-change-me',
  accessTokenExpiry: env.JWT_EXPIRY || '1d',
  refreshTokenExpiry: env.REFRESH_JWT_EXPIRY || '7d',
});

// Initialize auth middleware
export const requireAuth = createRequireAuth({
  verifyAccessToken: jwtUtils.verifyAccessToken,
});

// Initialize rate limiters
export const rateLimit = createRateLimit({ redis });
export const {
  strictRateLimit,
  moderateRateLimit,
  lenientRateLimit,
  loginRateLimit,
  paymentRateLimit,
  apiRateLimit,
} = createPreconfiguredRateLimiters({ redis });

// Initialize cache middleware
export const cache = createCache({ redis });

// Export sanitize input, validate request, and not found handler (no dependencies)
export { sanitizeInput, validateRequest, notFoundHandler };
