import {
  countPendingIncomingApplications,
  findUnreadMessagesByProject,
  markProjectChatAsRead,
  type NotificationsSummary,
} from "../repositories/notifications.repository.js";
import { AppError } from "../utils/app-error.js";

export async function getNotificationsSummary(
  userId: string
): Promise<NotificationsSummary> {
  const [pendingApplicationsCount, unreadMessagesByProject] = await Promise.all([
    countPendingIncomingApplications(userId),
    findUnreadMessagesByProject(userId),
  ]);

  const unreadMessagesCount = unreadMessagesByProject.reduce(
    (sum, project) => sum + project.unread_count,
    0
  );

  return {
    pendingApplicationsCount,
    unreadMessagesCount,
    unreadMessagesByProject,
  };
}

export async function markProjectMessagesAsRead(
  projectId: string,
  userId: string
): Promise<void> {
  const marked = await markProjectChatAsRead(projectId, userId);

  if (!marked) {
    throw new AppError(403, "Only project members can mark messages as read");
  }
}