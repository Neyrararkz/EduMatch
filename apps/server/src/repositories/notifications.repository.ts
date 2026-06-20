import { db } from "../config/database.js";

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

export async function countPendingIncomingApplications(userId: string): Promise<number> {
  const result = await db.query<{ count: number }>(
    `
    SELECT COUNT(*)::int AS count
    FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    WHERE p.creator_id = $1
      AND pa.status = 'pending'
    `,
    [userId]
  );

  return result.rows[0]?.count ?? 0;
}

export async function findUnreadMessagesByProject(
  userId: string
): Promise<ProjectUnreadMessages[]> {
  const result = await db.query<ProjectUnreadMessages>(
    `
    SELECT
      p.id AS project_id,
      p.title AS project_title,
      COUNT(m.id)::int AS unread_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    JOIN project_chats pc ON pc.project_id = p.id
    JOIN messages m ON m.chat_id = pc.id
    LEFT JOIN project_chat_reads pcr
      ON pcr.project_id = p.id
      AND pcr.user_id = $1
    WHERE pm.user_id = $1
      AND m.deleted_at IS NULL
      AND m.sender_id <> $1
      AND m.created_at > COALESCE(pcr.last_read_at, '1970-01-01'::timestamptz)
    GROUP BY p.id, p.title
    HAVING COUNT(m.id) > 0
    ORDER BY MAX(m.created_at) DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function markProjectChatAsRead(
  projectId: string,
  userId: string
): Promise<boolean> {
  const memberResult = await db.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM project_members
      WHERE project_id = $1
        AND user_id = $2
    )
    `,
    [projectId, userId]
  );

  const isMember = Boolean(memberResult.rows[0]?.exists);

  if (!isMember) {
    return false;
  }

  await db.query(
    `
    INSERT INTO project_chat_reads (
      project_id,
      user_id,
      last_read_at
    )
    VALUES ($1, $2, NOW())
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET last_read_at = NOW()
    `,
    [projectId, userId]
  );

  return true;
}