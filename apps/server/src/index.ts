import { createServer } from "http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { createChatWebSocketServer } from "./websocket/chat.websocket.js";

async function bootstrap() {
  try {
    await checkDatabaseConnection();
    await connectRedis();

    const app = createApp();
    const server = createServer(app);

    createChatWebSocketServer(server);

    server.listen(env.PORT, () => {
      console.log(`[server] Running in ${env.NODE_ENV} mode`);
      console.log(`[server] Listening on http://localhost:${env.PORT}`);
      console.log(`[server] Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`[server] WebSocket chat: ws://localhost:${env.PORT}/ws`);
    });
  } catch (error) {
    console.error("[server] Failed to start application");
    console.error(error);
    process.exit(1);
  }
}

bootstrap();