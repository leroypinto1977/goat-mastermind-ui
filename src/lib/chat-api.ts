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

const API_BASE_URL = "/api/scripting";

export class ChatAPI {
  private static readonly TIMEOUT_MS = 60000; // 1 minute timeout

  private static async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send cookies/credentials to external API
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any required headers for CORS
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.TIMEOUT_MS / 1000} seconds`);
      }
      throw error;
    }
  }

  static async sendMessage(
    message: string,
    chatHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/chat`, {
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        
        console.error('SendMessage API Error:', response.status, errorMessage);
        
        // Handle specific error types
        if (response.status === 408) {
          throw new Error("The AI service is taking too long to respond. Please try again.");
        } else if (response.status >= 500) {
          throw new Error("The AI service is currently unavailable. Please try again later.");
        } else {
          throw new Error(`API Error: ${errorMessage}`);
        }
      }

      return response.json();
    } catch (error) {
      console.error('SendMessage error:', error);
      if (error instanceof Error) {
        // Check for timeout from our fetchWithTimeout
        if (error.message.includes('timeout after')) {
          throw new Error("The request is taking too long. Please try again.");
        }
        // Check for network errors from the fetch
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
          throw new Error("Network connection issue. Please check your internet connection and try again.");
        }
        // If it's already a user-friendly message, pass it through
        if (error.message.includes('AI service') || error.message.includes('API Error')) {
          throw error;
        }
      }
      // Fallback for unexpected errors
      throw new Error("I'm having trouble processing your request. Could you please try again?");
    }
  }

  static async storeChat(
    userId: string,
    chatHistory: ChatMessage[]
  ): Promise<ChatHistoryResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/chat-history/store`, {
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
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('StoreChat error:', error);
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        throw new Error("Unable to save chat. Please check your connection.");
      }
      throw error;
    }
  }

  static async fetchChats(userId: string): Promise<FetchChatsResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/chat-history/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('FetchChats error:', error);
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        throw new Error("Unable to load chats. Please check your connection.");
      }
      throw error;
    }
  }

  static async updateChat(
    userId: string,
    chatId: string,
    chatHistory: ChatMessage[]
  ): Promise<UpdateChatResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/chat-history/update`, {
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
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('UpdateChat error:', error);
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        throw new Error("Unable to update chat. Please check your connection.");
      }
      throw error;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
}
