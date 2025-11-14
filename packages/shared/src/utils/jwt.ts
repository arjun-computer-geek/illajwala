import { sign, verify, type Secret, type SignOptions } from 'jsonwebtoken';

export type TokenRole = 'patient' | 'doctor' | 'admin';

export type TokenPayload = {
  sub: string;
  role: TokenRole;
  tenantId?: string | null;
};

type InternalJwtPayload = TokenPayload & {
  type?: 'access' | 'refresh';
};

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

const parseSeconds = (input: string): number => {
  const trimmed = input.trim();
  const directNumber = Number(trimmed);
  if (!Number.isNaN(directNumber) && directNumber > 0) {
    return directNumber;
  }

  const match = trimmed.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) {
    // default to 7 days
    return 7 * 24 * 60 * 60;
  }

  const value = Number(match[1]);
  const unitRaw = match[2];
  if (!unitRaw) {
    return 7 * 24 * 60 * 60;
  }
  const unit = unitRaw.toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
};

const assertTokenType = (payload: InternalJwtPayload, expected: 'access' | 'refresh') => {
  if (payload.type && payload.type !== expected) {
    throw new Error(`Invalid token type: expected ${expected}, received ${payload.type}`);
  }
};

export const createJwtUtils = (config: JwtConfig) => {
  const ACCESS_TOKEN_SECRET = config.accessTokenSecret as Secret;
  const REFRESH_TOKEN_SECRET = config.refreshTokenSecret as Secret;

  const accessTokenOptions = { expiresIn: config.accessTokenExpiry } as SignOptions;
  const refreshTokenOptions = { expiresIn: config.refreshTokenExpiry } as SignOptions;

  const refreshTokenMaxAgeSeconds = parseSeconds(config.refreshTokenExpiry);

  const signAccessToken = (payload: TokenPayload) =>
    sign({ ...payload, type: 'access' }, ACCESS_TOKEN_SECRET, accessTokenOptions);

  const signRefreshToken = (payload: TokenPayload) =>
    sign({ ...payload, type: 'refresh' }, REFRESH_TOKEN_SECRET, refreshTokenOptions);

  const verifyAccessToken = (token: string): TokenPayload => {
    const payload = verify(token, ACCESS_TOKEN_SECRET) as InternalJwtPayload;
    assertTokenType(payload, 'access');
    const result: TokenPayload = { sub: payload.sub, role: payload.role };
    if (payload.tenantId !== undefined) {
      result.tenantId = payload.tenantId ?? null;
    }
    return result;
  };

  const verifyRefreshToken = (token: string): TokenPayload => {
    const payload = verify(token, REFRESH_TOKEN_SECRET) as InternalJwtPayload;
    assertTokenType(payload, 'refresh');
    const result: TokenPayload = { sub: payload.sub, role: payload.role };
    if (payload.tenantId !== undefined) {
      result.tenantId = payload.tenantId ?? null;
    }
    return result;
  };

  return {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    refreshTokenMaxAgeSeconds,
  };
};
