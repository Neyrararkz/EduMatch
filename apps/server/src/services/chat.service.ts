import {
  createChatMessage,
  findProjectChatId,
  findProjectMessages,
  isProjectMember,
  type ChatMessageRecord,
} from "../repositories/chat.repository.js";
import { AppError } from "../utils/app-error.js";

export async function getMessagesForProject(
  projectId: string,
  userId: string
): Promise<ChatMessageRecord[]> {
  const isMember = await isProjectMember(projectId, userId);

  if (!isMember) {
    throw new AppError(403, "Only project members can read chat messages");
  }

  const chatId = await findProjectChatId(projectId);

  if (!chatId) {
    return [];
  }

  return findProjectMessages(projectId);
}

export async function createMessageForProject(
  projectId: string,
  userId: string,
  content: string
): Promise<ChatMessageRecord> {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new AppError(400, "Message content is required");
  }

  if (trimmedContent.length > 2000) {
    throw new AppError(400, "Message is too long");
  }

  const isMember = await isProjectMember(projectId, userId);

  if (!isMember) {
    throw new AppError(403, "Only project members can send chat messages");
  }

  return createChatMessage(projectId, userId, trimmedContent);
}