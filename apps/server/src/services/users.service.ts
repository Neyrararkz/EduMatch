import {
  deleteUserById,
  findAllPublicUsers,
  findPublicUserById,
  updatePublicUserById,
  type PublicUser,
} from "../repositories/users.repository.js";
import { AppError } from "../utils/app-error.js";
import { type UpdateMeBody } from "../validators/user.validator.js";

export async function getUsers(): Promise<PublicUser[]> {
  return findAllPublicUsers();
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await findPublicUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateMeBody
): Promise<PublicUser> {
  const updatedUser = await updatePublicUserById(userId, {
    fullName: input.fullName,
    avatarUrl: input.avatarUrl,
    about: input.about,
    university: input.university,
    course: input.course,
  });

  if (!updatedUser) {
    throw new AppError(404, "User not found");
  }

  return updatedUser;
}

export async function deleteCurrentUser(userId: string): Promise<void> {
  const deleted = await deleteUserById(userId);

  if (!deleted) {
    throw new AppError(404, "User not found");
  }
}