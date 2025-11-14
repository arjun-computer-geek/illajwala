import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/app-error';
import type { Logger } from '../utils/logger';

export interface ErrorHandlerConfig {
  logger: Logger;
  isProd?: boolean;
}

export const createErrorHandler = (config: ErrorHandlerConfig) => {
  const { logger, isProd = process.env.NODE_ENV === 'production' } = config;

  return (err: Error, req: Request, res: Response, _next: NextFunction) => {
    const isAppError = err instanceof AppError;
    const statusCode = isAppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;

    // Prevent information leakage in production
    // In production, don't expose internal error messages
    const message =
      isProd && !isAppError ? 'An internal error occurred' : err.message || 'Something went wrong';

    const response: {
      success: false;
      error: {
        message: string;
        code?: string;
        details?: unknown;
      };
    } = {
      success: false,
      error: {
        message,
        ...(isAppError && err.details ? { details: err.details } : {}),
      },
    };

    // Log errors with context (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      const errorContext = {
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      if (statusCode >= 500) {
        // Server errors - log with full context
        logger.error(`Server error: ${err.message}`, err, errorContext);
      } else if (statusCode >= 400) {
        // Client errors - log with context (less verbose)
        logger.warn(`Client error: ${err.message}`, errorContext);
      }
    }

    res.status(statusCode).json(response);
  };
};
