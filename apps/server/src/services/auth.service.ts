import { randomUUID } from "node:crypto";

import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  createUser,
  findPublicUserById,
  findUserByEmail,
  type PublicUser,
} from "../repositories/users.repository.js";
import {
  type LoginBody,
  type LogoutBody,
  type RefreshBody,
  type RegisterBody,
} from "../validators/auth.validator.js";

type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

function secondsFromExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    return 7 * 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  if (unit === "d") return amount * 24 * 60 * 60;

  return 7 * 24 * 60 * 60;
}

async function createAuthSession(user: PublicUser): Promise<AuthResponse> {
  const sessionId = randomUUID();

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
    sessionId,
  });

  await redisClient.set(`refresh_session:${sessionId}`, user.id, {
    EX: secondsFromExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
}

export async function registerUser(
  input: RegisterBody
): Promise<AuthResponse> {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError(409, "User with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    university: input.university,
    course: input.course,
  });

  return createAuthSession(user);
}

export async function loginUser(input: LoginBody): Promise<AuthResponse> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(
    input.password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const { password_hash: _passwordHash, ...publicUser } = user;

  return createAuthSession(publicUser);
}

export async function refreshAccessToken(input: RefreshBody): Promise<{
  accessToken: string;
}> {
  try {
    const payload = verifyRefreshToken(input.refreshToken);

    const sessionUserId = await redisClient.get(
      `refresh_session:${payload.sessionId}`
    );

    if (!sessionUserId || sessionUserId !== payload.userId) {
      throw new AppError(401, "Invalid refresh session");
    }

    const user = await findPublicUserById(payload.userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
    });

    return { accessToken };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid or expired refresh token");
  }
}

export async function logoutUser(input: LogoutBody): Promise<void> {
  try {
    const payload = verifyRefreshToken(input.refreshToken);

    await redisClient.del(`refresh_session:${payload.sessionId}`);
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}