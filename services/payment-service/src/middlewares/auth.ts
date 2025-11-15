import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verify, type Secret } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

type Role = 'patient' | 'doctor' | 'admin';

export interface AuthenticatedRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<Params, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    role: Role;
    tenantId?: string | null;
  };
  tenantId?: string;
}

type TokenPayload = {
  sub: string;
  role: Role;
  tenantId?: string | null;
  type?: 'access' | 'refresh';
};

const ACCESS_TOKEN_SECRET = env.JWT_SECRET as Secret;

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    if (token) {
      return token;
    }
  }

  const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;
  if (queryToken) {
    return queryToken;
  }

  return null;
};

export const requireAuth = (roles: Role[] = ['patient', 'doctor', 'admin']) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return next(AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' }));
    }

    try {
      const payload = verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
      if (!roles.includes(payload.role)) {
        return next(AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Forbidden' }));
      }

      req.user = {
        id: payload.sub,
        role: payload.role,
        ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      };
      if (payload.tenantId) {
        req.tenantId = payload.tenantId;
      }
      next();
    } catch (error) {
      next(
        AppError.from({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Invalid token',
          cause: error as Error,
        }),
      );
    }
  };
};
