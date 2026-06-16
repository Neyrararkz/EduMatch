import { apiRequest } from "./client";
import type { AuthResponse, User } from "../types/auth";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  university?: string;
  course?: number;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function getMe(token: string) {
  return apiRequest<{ user: User }>("/auth/me", {
    token,
  });
}

export function refresh(refreshToken: string) {
  return apiRequest<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export function logout(refreshToken: string) {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}