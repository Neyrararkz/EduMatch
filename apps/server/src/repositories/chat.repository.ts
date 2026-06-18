import { db } from "../config/database.js";

export type ChatMessageRecord = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
  edited_at: Date | null;
  deleted_at: Date | null;
  sender_full_name: string;
  sender_email: string;
  sender_avatar_url: string | null;
};

export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM project_members
      WHERE project_id = $1 AND user_id = $2
    )
    `,
    [projectId, userId]
  );

  return Boolean(result.rows[0]?.exists);
}

export async function findProjectChatId(projectId: string): Promise<string | null> {
  const result = await db.query<{ id: string }>(
    `
    SELECT id
    FROM project_chats
    WHERE project_id = $1
    `,
    [projectId]
  );

  return result.rows[0]?.id ?? null;
}

export async function findProjectMessages(
  projectId: string
): Promise<ChatMessageRecord[]> {
  const result = await db.query<ChatMessageRecord>(
    `
    SELECT
      m.id,
      m.chat_id,
      m.sender_id,
      m.content,
      m.created_at,
      m.edited_at,
      m.deleted_at,
      u.full_name AS sender_full_name,
      u.email AS sender_email,
      u.avatar_url AS sender_avatar_url
    FROM messages m
    JOIN project_chats pc ON pc.id = m.chat_id
    JOIN users u ON u.id = m.sender_id
    WHERE pc.project_id = $1
      AND m.deleted_at IS NULL
    ORDER BY m.created_at ASC
    `,
    [projectId]
  );

  return result.rows;
}

export async function createChatMessage(
  projectId: string,
  senderId: string,
  content: string
): Promise<ChatMessageRecord> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const chatResult = await client.query<{ id: string }>(
      `
      INSERT INTO project_chats (project_id)
      VALUES ($1)
      ON CONFLICT (project_id)
      DO UPDATE SET project_id = EXCLUDED.project_id
      RETURNING id
      `,
      [projectId]
    );

    const chatId = chatResult.rows[0]?.id;

    if (!chatId) {
      throw new Error("Project chat not found");
    }

    const messageResult = await client.query<ChatMessageRecord>(
      `
      INSERT INTO messages (
        chat_id,
        sender_id,
        content
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        chat_id,
        sender_id,
        content,
        created_at,
        edited_at,
        deleted_at
      `,
      [chatId, senderId, content]
    );

    const message = messageResult.rows[0];

    if (!message) {
      throw new Error("Failed to create message");
    }

    const fullMessageResult = await client.query<ChatMessageRecord>(
      `
      SELECT
        m.id,
        m.chat_id,
        m.sender_id,
        m.content,
        m.created_at,
        m.edited_at,
        m.deleted_at,
        u.full_name AS sender_full_name,
        u.email AS sender_email,
        u.avatar_url AS sender_avatar_url
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = $1
      `,
      [message.id]
    );

    await client.query("COMMIT");

    const fullMessage = fullMessageResult.rows[0];

    if (!fullMessage) {
      throw new Error("Failed to load message");
    }

    return fullMessage;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}