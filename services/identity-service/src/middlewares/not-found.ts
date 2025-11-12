import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(
    AppError.from({
      statusCode: 404,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    })
  );
};

