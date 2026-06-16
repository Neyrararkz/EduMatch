import { apiRequest } from "./client";
import type { User } from "../types/auth";

export type UpdateProfileInput = {
  fullName?: string;
  avatarUrl?: string;
  about?: string;
  university?: string;
  course?: number;
};

export function getUsers(token: string) {
  return apiRequest<{ users: User[] }>("/users", {
    token,
  });
}

export function getUserById(userId: string, token: string) {
  return apiRequest<{ user: User }>(`/users/${userId}`, {
    token,
  });
}

export function updateMe(input: UpdateProfileInput, token: string) {
  return apiRequest<{ user: User }>("/users/me", {
    method: "PATCH",
    body: input,
    token,
  });
}