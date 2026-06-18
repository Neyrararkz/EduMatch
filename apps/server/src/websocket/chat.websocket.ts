import { type IncomingMessage } from "http";
import { type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";

import { createMessageForProject } from "../services/chat.service.js";
import { verifyAccessToken } from "../utils/jwt.js";

type ClientMessage = {
  type?: string;
  content?: unknown;
};

const clientsByProject = new Map<string, Set<WebSocket>>();

function getConnectionData(request: IncomingMessage) {
  const url = new URL(request.url ?? "", "http://localhost");

  const token = url.searchParams.get("token");
  const projectId = url.searchParams.get("projectId");

  if (!token || !projectId) {
    return null;
  }

  const payload = verifyAccessToken(token);

  return {
    projectId,
    userId: payload.userId,
  };
}

function addClient(projectId: string, socket: WebSocket) {
  const clients = clientsByProject.get(projectId) ?? new Set<WebSocket>();
  clients.add(socket);
  clientsByProject.set(projectId, clients);
}

function removeClient(projectId: string, socket: WebSocket) {
  const clients = clientsByProject.get(projectId);

  if (!clients) return;

  clients.delete(socket);

  if (clients.size === 0) {
    clientsByProject.delete(projectId);
  }
}

function broadcast(projectId: string, data: unknown) {
  const clients = clientsByProject.get(projectId);

  if (!clients) return;

  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function createChatWebSocketServer(server: Server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  webSocketServer.on("connection", (socket, request) => {
    let connectionData: ReturnType<typeof getConnectionData>;

    try {
      connectionData = getConnectionData(request);
    } catch {
      socket.close();
      return;
    }

    if (!connectionData) {
      socket.close();
      return;
    }

    const { projectId, userId } = connectionData;

    addClient(projectId, socket);

    socket.on("message", async (rawData) => {
      try {
        const parsedMessage = JSON.parse(rawData.toString()) as ClientMessage;

        if (parsedMessage.type !== "message") {
          return;
        }

        if (typeof parsedMessage.content !== "string") {
          return;
        }

        const message = await createMessageForProject(
          projectId,
          userId,
          parsedMessage.content
        );

        broadcast(projectId, {
          type: "message",
          message,
        });
      } catch {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Не удалось отправить сообщение",
          })
        );
      }
    });

    socket.on("close", () => {
      removeClient(projectId, socket);
    });
  });

  return webSocketServer;
}