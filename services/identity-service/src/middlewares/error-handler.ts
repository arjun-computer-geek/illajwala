import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/app-error";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Something went wrong";
  const response = {
    error: {
      message,
      ...(isAppError && err.details ? { details: err.details } : {}),
    },
  };

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json(response);
};

