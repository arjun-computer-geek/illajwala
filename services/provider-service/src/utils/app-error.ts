import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { ZodError } from 'zod';

export interface AppErrorOptions {
  message?: string;
  statusCode?: number;
  details?: unknown;
  cause?: Error;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public cause?: Error;

  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static from(options: AppErrorOptions = {}): AppError {
    const statusCode = options.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
    const message =
      options.message ??
      (statusCode ? getReasonPhrase(statusCode) : 'An unexpected error occurred');
    const error = new AppError(message, statusCode, options.details);
    if (options.cause) {
      error.cause = options.cause;
    }
    return error;
  }

  static fromZod(
    error: ZodError,
    message = 'Validation failed',
    statusCode = StatusCodes.BAD_REQUEST,
  ) {
    return new AppError(message, statusCode, error.flatten());
  }
}
