import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  sessionId?: string;
};

export function signAccessToken(payload: AuthTokenPayload): string {
  const options = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions;

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(
  payload: AuthTokenPayload & { sessionId: string }
): string {
  const options = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions;

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(
  token: string
): AuthTokenPayload & { sessionId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload & {
    sessionId: string;
  };
}