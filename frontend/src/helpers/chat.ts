import { ServerError, UnauthorizedError } from "../errors";
import type {
  ChatRoom,
  LoadChatResponse,
  SendMessageResponse,
} from "../types/chat";

export async function fetchChatRooms(): Promise<ChatRoom[]> {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new UnauthorizedError("User Unauthorized!", res.status);
    } else if (res.status === 500) {
      throw new ServerError("Internal Server Error!", res.status);
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch chat rooms: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ServerError) {
      throw err;
    }
    throw new Error("Failed to fetch chat rooms", { cause: err });
  }
}

export async function loadChat(threadId: string): Promise<LoadChatResponse> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/load/${threadId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      throw new UnauthorizedError("User Unauthorized!", res.status);
    } else if (res.status === 500) {
      throw new ServerError("Internal Server Error!", res.status);
    }

    if (!res.ok) {
      throw new Error(`Failed to load chat: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ServerError) {
      throw err;
    }
    throw new Error("Failed to load chat", { cause: err });
  }
}

export async function sendChatMessage(
  message: string,
  threadId: string | null
): Promise<SendMessageResponse> {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message,
        thread: threadId || null,
      }),
    });

    if (res.status === 401) {
      throw new UnauthorizedError("User Unauthorized!", res.status);
    } else if (res.status === 500) {
      throw new ServerError("Internal Server Error!", res.status);
    }

    if (!res.ok) {
      throw new Error(`Failed to send message: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ServerError) {
      throw err;
    }
    throw new Error("Failed to send message", { cause: err });
  }
}
