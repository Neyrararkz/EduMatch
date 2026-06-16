import {
  findAllSkills,
  findUserSkills,
  replaceUserSkills,
  type SkillRecord,
  type UserSkillRecord,
} from "../repositories/skills.repository.js";
import { findPublicUserById } from "../repositories/users.repository.js";
import { AppError } from "../utils/app-error.js";
import { type UpdateUserSkillsBody } from "../validators/skill.validator.js";

export async function getSkills(): Promise<SkillRecord[]> {
  return findAllSkills();
}

export async function getSkillsByUserId(
  userId: string
): Promise<UserSkillRecord[]> {
  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return findUserSkills(userId);
}

export async function updateSkillsForUser(
  userId: string,
  input: UpdateUserSkillsBody
): Promise<UserSkillRecord[]> {
  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return replaceUserSkills(
    userId,
    input.skills.map((skill) => ({
      skillId: skill.skillId,
      level: skill.level,
    }))
  );
}