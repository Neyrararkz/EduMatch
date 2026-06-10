import { createClient } from "redis";

import { env } from "./env.js";

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("[redis] Redis client error:", error);
});

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  await redisClient.ping();

  console.log("[redis] Redis connected");
}