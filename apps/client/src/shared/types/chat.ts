export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender_full_name: string;
  sender_email: string;
  sender_avatar_url: string | null;
};

export type WebSocketChatMessage = {
  type: "message";
  message: ChatMessage;
};

export type WebSocketErrorMessage = {
  type: "error";
  message: string;
};

export type WebSocketIncomingMessage = WebSocketChatMessage | WebSocketErrorMessage;