import { sign, verify, type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";

interface JwtPayload {
  sub: string;
  role: "patient" | "doctor" | "admin";
}

const JWT_SECRET = env.JWT_SECRET as Secret;

const signOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRY as StringValue,
};

export const signJwt = (payload: JwtPayload) => sign(payload, JWT_SECRET, signOptions);

export const verifyJwt = (token: string) => verify(token, JWT_SECRET) as JwtPayload;

