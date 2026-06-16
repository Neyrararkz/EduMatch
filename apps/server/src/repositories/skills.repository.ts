import { db } from "../config/database.js";

export type SkillRecord = {
  id: string;
  name: string;
  created_at: Date;
};

export type UserSkillRecord = {
  id: string;
  name: string;
  level: string;
};

export type UpdateUserSkillInput = {
  skillId: string;
  level?: string | undefined;
};

export async function findAllSkills(): Promise<SkillRecord[]> {
  const result = await db.query<SkillRecord>(
    `
    SELECT id, name, created_at
    FROM skills
    ORDER BY name ASC
    `
  );

  return result.rows;
}

export async function findUserSkills(
  userId: string
): Promise<UserSkillRecord[]> {
  const result = await db.query<UserSkillRecord>(
    `
    SELECT
      s.id,
      s.name,
      us.level
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = $1
    ORDER BY s.name ASC
    `,
    [userId]
  );

  return result.rows;
}

export async function replaceUserSkills(
  userId: string,
  skills: UpdateUserSkillInput[]
): Promise<UserSkillRecord[]> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM user_skills
      WHERE user_id = $1
      `,
      [userId]
    );

    for (const skill of skills) {
      await client.query(
        `
        INSERT INTO user_skills (
          user_id,
          skill_id,
          level
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, skill_id)
        DO UPDATE SET level = EXCLUDED.level
        `,
        [userId, skill.skillId, skill.level ?? "beginner"]
      );
    }

    await client.query("COMMIT");

    return findUserSkills(userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}