import { apiRequest } from "./client";
import type { Skill, UpdateUserSkillInput, UserSkill } from "../types/skill";

export function getSkills(token: string) {
  return apiRequest<{ skills: Skill[] }>("/skills", {
    token,
  });
}

export function getMySkills(token: string) {
  return apiRequest<{ skills: UserSkill[] }>("/users/me/skills", {
    token,
  });
}

export function getUserSkills(userId: string, token: string) {
  return apiRequest<{ skills: UserSkill[] }>(`/users/${userId}/skills`, {
    token,
  });
}

export function updateMySkills(skills: UpdateUserSkillInput[], token: string) {
  return apiRequest<{ skills: UserSkill[] }>("/users/me/skills", {
    method: "PATCH",
    body: { skills },
    token,
  });
}