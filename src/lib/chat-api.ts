// Chat API client for communicating with the scripting API
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  chat_history: ChatMessage[];
}

export interface ChatHistoryRequest {
  user_id: string;
  chat_history: ChatMessage[];
}

export interface ChatHistoryResponse {
  message: string;
  user_id: string;
  chat_id: string;
}

export interface FetchChatsRequest {
  user_id: string;
}

export interface FetchChatsResponse {
  user_id: string;
  chats: {
    chat_id: string;
    chat_history: ChatMessage[];
    created_at: string;
    updated_at: string;
  }[];
}

export interface UpdateChatRequest {
  user_id: string;
  chat_id: string;
  chat_history: ChatMessage[];
}

export interface UpdateChatResponse {
  message: string;
  user_id: string;
  chat_id: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";

export class ChatAPI {
  static async sendMessage(
    message: string,
    chatHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async storeChat(
    userId: string,
    chatHistory: ChatMessage[]
  ): Promise<ChatHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/chat-history/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async fetchChats(userId: string): Promise<FetchChatsResponse> {
    const response = await fetch(`${API_BASE_URL}/chat-history/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async updateChat(
    userId: string,
    chatId: string,
    chatHistory: ChatMessage[]
  ): Promise<UpdateChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat-history/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        chat_history: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
