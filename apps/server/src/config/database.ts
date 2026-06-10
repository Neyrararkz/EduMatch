import { Pool } from "pg";

import { env } from "./env.js";

export const db: Pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function checkDatabaseConnection(): Promise<void> {
  try {
    const result = await db.query("SELECT NOW()");

    console.log("[database] PostgreSQL connected:", result.rows[0].now);
  } catch (error) {
    console.error("[database] PostgreSQL connection failed");
    throw error;
  }
}