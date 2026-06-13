import { db } from "../config/database.js";

export type UserRecord = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  about: string | null;
  university: string | null;
  course: number | null;
  rating: string | number | null;
  created_at: Date;
  updated_at: Date;
};

export type PublicUser = Omit<UserRecord, "password_hash">;

export type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  university?: string | undefined;
  course?: number | undefined;
};

const publicUserFields = `
  id,
  full_name,
  email,
  avatar_url,
  about,
  university,
  course,
  rating,
  created_at,
  updated_at
`;

export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const result = await db.query<UserRecord>(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      avatar_url,
      about,
      university,
      course,
      rating,
      created_at,
      updated_at
    FROM users
    WHERE email = $1
    `,
    [email.toLowerCase()]
  );

  return result.rows[0] ?? null;
}

export async function findPublicUserById(
  userId: string
): Promise<PublicUser | null> {
  const result = await db.query<PublicUser>(
    `
    SELECT ${publicUserFields}
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  input: CreateUserInput
): Promise<PublicUser> {
  const result = await db.query<PublicUser>(
    `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      university,
      course
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${publicUserFields}
    `,
    [
      input.fullName,
      input.email.toLowerCase(),
      input.passwordHash,
      input.university ?? null,
      input.course ?? null,
    ]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}