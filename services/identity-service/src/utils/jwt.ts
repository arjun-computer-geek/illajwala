import { sign, verify, type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type TokenRole = "patient" | "doctor" | "admin";

type TokenPayload = {
  sub: string;
  role: TokenRole;
};

type InternalJwtPayload = TokenPayload & {
  type?: "access" | "refresh";
};

const ACCESS_TOKEN_SECRET = env.JWT_SECRET as Secret;
const REFRESH_TOKEN_SECRET = env.REFRESH_JWT_SECRET as Secret;

const accessTokenOptions = { expiresIn: env.JWT_EXPIRY } as SignOptions;
const refreshTokenOptions = { expiresIn: env.REFRESH_JWT_EXPIRY } as SignOptions;

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
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
};

export const refreshTokenMaxAgeSeconds = parseSeconds(env.REFRESH_JWT_EXPIRY);

const assertTokenType = (payload: InternalJwtPayload, expected: "access" | "refresh") => {
  if (payload.type && payload.type !== expected) {
    throw new Error(`Invalid token type: expected ${expected}, received ${payload.type}`);
  }
};

export const signAccessToken = (payload: TokenPayload) =>
  sign({ ...payload, type: "access" }, ACCESS_TOKEN_SECRET, accessTokenOptions);

export const signRefreshToken = (payload: TokenPayload) =>
  sign({ ...payload, type: "refresh" }, REFRESH_TOKEN_SECRET, refreshTokenOptions);

export const verifyAccessToken = (token: string): TokenPayload => {
  const payload = verify(token, ACCESS_TOKEN_SECRET) as InternalJwtPayload;
  assertTokenType(payload, "access");
  return { sub: payload.sub, role: payload.role };
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = verify(token, REFRESH_TOKEN_SECRET) as InternalJwtPayload;
  assertTokenType(payload, "refresh");
  return { sub: payload.sub, role: payload.role };
};

