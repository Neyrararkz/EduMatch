import { useEffect, useRef, useState, type FormEvent } from "react";

import { useAuth } from "../../app/AuthProvider";
import { getProjectMessages } from "../../shared/api/chat";
import { getStoredAccessToken } from "../../shared/api/token-storage";
import type { ChatMessage, WebSocketIncomingMessage } from "../../shared/types/chat";
import { UserAvatar } from "../../shared/ui/UserAvatar";

type ProjectChatProps = {
  projectId: string;
};

const API_URL = import.meta.env.VITE_API_URL;

function createWebSocketUrl(projectId: string, token: string) {
  const baseUrl = API_URL.replace(/^http/, "ws").replace(/\/api$/, "/ws");

  const params = new URLSearchParams({
    projectId,
    token,
  });

  return `${baseUrl}?${params.toString()}`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { user } = useAuth();

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      setError("");
      setIsLoading(true);

      try {
        const response = await getProjectMessages(projectId);
        setMessages(response.messages);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Не удалось загрузить сообщения");
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [projectId]);

  useEffect(() => {
    const token = getStoredAccessToken();

    if (!token) return;

    const socket = new WebSocket(createWebSocketUrl(projectId, token));
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setIsConnected(true);
      setError("");
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as WebSocketIncomingMessage;

      if (data.type === "message") {
        setMessages((currentMessages) => [...currentMessages, data.message]);
      }

      if (data.type === "error") {
        setError(data.message);
      }
    });

    socket.addEventListener("error", () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        content: trimmedContent,
      })
    );

    setContent("");
  }

  if (isLoading) {
    return <p>Загрузка чата...</p>;
  }

  return (
    <section>
      <h3>Чат проекта</h3>

      <p>{isConnected ? "Подключено" : "Подключение..."}</p>

      {error && <p>{error}</p>}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p>Сообщений пока нет.</p>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.sender_id === user?.id;

            return (
              <div
                className={`chat-row ${isMyMessage ? "chat-row-own" : ""}`}
                key={message.id}
              >
                <UserAvatar
                  src={message.sender_avatar_url}
                  name={message.sender_full_name}
                  size="sm"
                />

                <div className="chat-bubble">
                  <div className="chat-message-header">
                    <strong>{message.sender_full_name}</strong>
                    <span>{formatTime(message.created_at)}</span>
                  </div>

                  <p>{message.content}</p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Напишите сообщение..."
        />

        <button type="submit" disabled={!isConnected || !content.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}