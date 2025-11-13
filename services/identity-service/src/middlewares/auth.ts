import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/app-error";
import { StatusCodes } from "http-status-codes";

type Role = "patient" | "doctor" | "admin";

export interface AuthenticatedRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<Params, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    role: Role;
  };
}

export const requireAuth = (roles: Role[] = ["patient", "doctor", "admin"]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return next(AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: "Unauthorized" }));
    }

    try {
      const token = header.split(" ")[1];
      if (!token) {
        return next(AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: "Unauthorized" }));
      }
      const payload = verifyAccessToken(token);

      if (!roles.includes(payload.role)) {
        return next(AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: "Forbidden" }));
      }

      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch (error) {
      next(AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: "Invalid token", cause: error as Error }));
    }
  };
};

