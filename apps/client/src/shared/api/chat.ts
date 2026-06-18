import { apiRequest } from "./client";
import type { ChatMessage } from "../types/chat";

export function getProjectMessages(projectId: string) {
  return apiRequest<{ messages: ChatMessage[] }>(`/projects/${projectId}/messages`);
}