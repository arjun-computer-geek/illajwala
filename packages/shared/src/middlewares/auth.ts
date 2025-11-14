import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { TokenPayload, TokenRole } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { getTenantIdFromHeaders } from '../utils/tenant';

// Export AuthenticatedRequest type for use in services
export interface AuthenticatedRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<Params, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    role: TokenRole;
    tenantId?: string | null;
  };
  tenantId?: string;
}

export interface AuthMiddlewareConfig {
  verifyAccessToken: (token: string) => TokenPayload;
}

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

export const createRequireAuth = (config: AuthMiddlewareConfig) => {
  const { verifyAccessToken } = config;

  return (roles: TokenRole[] = ['patient', 'doctor', 'admin']) => {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      const token = extractToken(req);

      if (!token) {
        return next(
          AppError.from({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' }),
        );
      }

      try {
        const payload = verifyAccessToken(token);
        if (!roles.includes(payload.role)) {
          return next(AppError.from({ statusCode: StatusCodes.FORBIDDEN, message: 'Forbidden' }));
        }

        const headerTenantId = getTenantIdFromHeaders(req);
        if (payload.tenantId && headerTenantId && payload.tenantId !== headerTenantId) {
          return next(
            AppError.from({
              statusCode: StatusCodes.FORBIDDEN,
              message: 'Tenant context mismatch between token and request headers',
            }),
          );
        }

        const resolvedTenant = payload.tenantId ?? headerTenantId ?? null;

        req.user = {
          id: payload.sub,
          role: payload.role,
          ...(resolvedTenant ? { tenantId: resolvedTenant } : {}),
        };
        if (resolvedTenant) {
          req.tenantId = resolvedTenant;
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
};
