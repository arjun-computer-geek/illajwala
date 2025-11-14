import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/app-error';

/**
 * Sanitizes string inputs to prevent XSS and injection attacks
 * Removes potentially dangerous characters and patterns
 */
const sanitizeString = (value: unknown, isStrict: boolean = false): string => {
  if (typeof value !== 'string') {
    return String(value);
  }

  // For API endpoints, we mainly need to prevent injection attacks
  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  let sanitized = value.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove script tags and event handlers (basic XSS prevention)
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '');

  // In strict mode, also remove HTML tags
  if (isStrict) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Recursively sanitizes object values
 * @param obj - Object to sanitize
 * @param isStrict - Whether to use strict sanitization (remove HTML tags)
 */
const sanitizeObject = (obj: unknown, isStrict: boolean = false): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, isStrict);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, isStrict));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key, isStrict);
      sanitized[sanitizedKey] = sanitizeObject(value, isStrict);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 * Prevents XSS and injection attacks
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, false) as typeof req.body;
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, false) as typeof req.query;
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, false) as typeof req.params;
    }

    next();
  } catch (error) {
    next(
      AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid request data',
        cause: error as Error,
      }),
    );
  }
};
