import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '../utils/logger';
import { randomUUID } from 'crypto';

export interface RequestLoggerConfig {
  logger: Logger;
}

export const createRequestLogger = (config: RequestLoggerConfig) => {
  const { logger } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Add request ID to response locals for use in error handlers
    res.locals.requestId = requestId;

    const startTime = Date.now();

    // Log request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      tenantId: req.headers['x-tenant-id'] || 'unknown',
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const context = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      };

      if (res.statusCode >= 500) {
        logger.error('Request completed with server error', undefined, context);
      } else if (res.statusCode >= 400) {
        logger.warn('Request completed with client error', context);
      } else {
        logger.info('Request completed successfully', context);
      }
    });

    next();
  };
};
