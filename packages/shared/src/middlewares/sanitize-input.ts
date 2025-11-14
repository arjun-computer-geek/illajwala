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

  if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') {
    return obj;
  }

  if (Buffer.isBuffer(obj) || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, isStrict));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      // Skip sanitization for sensitive fields (they'll be hashed/encrypted)
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('hash') ||
        lowerKey.includes('signature') ||
        lowerKey === 'rawbody'
      ) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value, isStrict);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 * Prevents XSS attacks and injection attempts
 * Note: This is a basic sanitization - Zod validation provides primary protection
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Sanitize request body (but preserve structure for Zod validation)
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      req.body = sanitizeObject(req.body, false) as typeof req.body;
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          sanitizedQuery[key] = sanitizeString(value, false);
        } else if (Array.isArray(value)) {
          sanitizedQuery[key] = value.map((v) =>
            typeof v === 'string' ? sanitizeString(v, false) : v,
          );
        } else {
          sanitizedQuery[key] = value;
        }
      }
      req.query = sanitizedQuery as typeof req.query;
    }

    // Sanitize route parameters (always strict for IDs)
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          // Strict sanitization for route params (especially IDs)
          sanitizedParams[key] = sanitizeString(value, true);
        } else {
          sanitizedParams[key] = String(value);
        }
      }
      req.params = sanitizedParams;
    }

    next();
  } catch {
    next(
      AppError.from({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid input data',
      }),
    );
  }
};

/**
 * Validates MongoDB ObjectId format to prevent injection
 */
export const validateObjectId = (id: string): boolean => {
  // MongoDB ObjectId must be exactly 24 hexadecimal characters
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

/**
 * Middleware to validate ObjectId parameters
 */
export const validateObjectIdParam = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (id && !validateObjectId(id)) {
      return next(
        AppError.from({
          statusCode: StatusCodes.BAD_REQUEST,
          message: `Invalid ${paramName} format`,
        }),
      );
    }
    next();
  };
};
