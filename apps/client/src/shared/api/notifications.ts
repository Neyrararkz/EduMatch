import { apiRequest } from "./client";
import type { NotificationsSummary } from "../types/notification";

export function getNotificationsSummary(token: string) {
  return apiRequest<{ summary: NotificationsSummary }>("/notifications/summary", {
    token,
  });
}

export function markProjectChatAsRead(projectId: string, token: string) {
  return apiRequest<{ message: string }>(`/notifications/projects/${projectId}/read`, {
    method: "POST",
    token,
  });
}

export function requestNotificationsRefresh() {
  window.dispatchEvent(new Event("edumatch-notifications-refresh"));
}