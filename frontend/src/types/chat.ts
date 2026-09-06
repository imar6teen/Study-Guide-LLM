export interface ChatRoom {
  chatrooms_id: string;
  thread_id: string;
  room_name: string;
  timestamp: string;
  updated_at: string;
}

export interface ChatMessageItem {
  chats_id: string;
  id: string;
  chatrooms_id: string;
  order: number;
  type: "human" | "ai";
  role: "user" | "ai";
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LoadChatResponse {
  chatrooms_id: string;
  thread_id: string;
  room_name: string;
  chats: ChatMessageItem[];
}

export interface SendMessageResponse {
  message: string;
  thread: string;
  topic: string | null;
  subtopic: string[] | null;
  references: Record<string, string[]> | null;
}
