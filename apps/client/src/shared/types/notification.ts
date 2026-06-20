export type ProjectUnreadMessages = {
  project_id: string;
  project_title: string;
  unread_count: number;
};

export type NotificationsSummary = {
  pendingApplicationsCount: number;
  unreadMessagesCount: number;
  unreadMessagesByProject: ProjectUnreadMessages[];
};