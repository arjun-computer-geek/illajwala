import { verify, type Secret } from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenRole = 'patient' | 'doctor' | 'admin';

export type TokenPayload = {
  sub: string;
  role: TokenRole;
  tenantId?: string | null;
};

type InternalJwtPayload = TokenPayload & {
  type?: 'access' | 'refresh';
};

const ACCESS_TOKEN_SECRET = env.JWT_SECRET as Secret;

export const verifyAccessToken = (token: string): TokenPayload => {
  const payload = verify(token, ACCESS_TOKEN_SECRET) as InternalJwtPayload;
  const result: TokenPayload = { sub: payload.sub, role: payload.role };
  if (payload.tenantId !== undefined) {
    result.tenantId = payload.tenantId ?? null;
  }
  return result;
};
