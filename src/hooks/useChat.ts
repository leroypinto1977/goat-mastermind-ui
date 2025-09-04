import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChatMessage, ChatAPI } from "../lib/chat-api";

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isLoading?: boolean;
}

interface UseChatReturn {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  apiConnected: boolean;

  // Actions
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  clearError: () => void;
  refreshChats: () => Promise<void>;
}

const generateChatId = () =>
  `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateChatTitle = (firstMessage: string): string => {
  if (firstMessage.length <= 50) return firstMessage;
  return firstMessage.substring(0, 47) + "...";
};

const sortChatsByMostRecent = (chats: Chat[]): Chat[] => {
  return [...chats].sort((a, b) => {
    const aTime = a.updatedAt.getTime();
    const bTime = b.updatedAt.getTime();
    if (aTime !== bTime) {
      return bTime - aTime; // Most recent first
    }
    return b.createdAt.getTime() - a.createdAt.getTime(); // If same updated time, use created time
  });
};

export function useChat(): UseChatReturn {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  const userId = session?.user?.id;

  // Check API connection
  const checkApiConnection = useCallback(async () => {
    try {
      const connected = await ChatAPI.checkHealth();
      setApiConnected(connected);
    } catch (error) {
      setApiConnected(false);
    }
  }, []);

  // Load user chats from API
  const loadUserChats = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await ChatAPI.fetchChats(userId);

      const loadedChats: Chat[] = response.chats
        .filter(
          (chat: any) => chat.chat_history && chat.chat_history.length > 0
        ) // Filter out empty/deleted chats
        .map((chat: any) => ({
          id: chat.chat_id,
          title:
            chat.chat_history.length > 0
              ? generateChatTitle(chat.chat_history[0].content)
              : "Empty Chat",
          messages: chat.chat_history,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
        }));

      // Sort chats by most recent first
      setChats(sortChatsByMostRecent(loadedChats));
    } catch (error) {
      console.error("Failed to load chats:", error);
      setError(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initialize when user is available
  useEffect(() => {
    if (userId) {
      checkApiConnection();
      loadUserChats();
    }
  }, [userId, checkApiConnection, loadUserChats]);

  const createNewChat = useCallback((): string => {
    const chatId = generateChatId();
    const newChat: Chat = {
      id: chatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(chatId);
    return chatId;
  }, []);

  const selectChat = useCallback(
    (chatId: string) => {
      setCurrentChatId(chatId);

      // If selecting a chat that exists in backend (has a proper UUID format),
      // we might want to refresh it to ensure we have the latest data
      const selectedChat = chats.find((c) => c.id === chatId);
      if (selectedChat && chatId.includes("-") && chatId.length > 20) {
        // This looks like a backend UUID, consider refreshing
        // For now, we'll trust our local state unless there are sync issues
      }
    },
    [chats]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!userId) {
        setError("User not authenticated");
        return;
      }

      let chatId = currentChatId;

      // Create new chat if none selected
      if (!chatId) {
        chatId = createNewChat();
      }

      const chat = chats.find((c) => c.id === chatId);
      if (!chat) {
        setError("Chat not found");
        return;
      }

      // Add user message
      const userMessage: ChatMessage = { role: "user", content: message };
      const updatedMessages = [...chat.messages, userMessage];

      // Update chat with user message and set loading
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: updatedMessages,
                title:
                  c.messages.length === 0
                    ? generateChatTitle(message)
                    : c.title,
                updatedAt: new Date(),
                isLoading: true,
              }
            : c
        )
      );

      setIsLoading(true);
      setError(null);

      try {
        // Send to API
        const response = await ChatAPI.sendMessage(message, chat.messages);

        // Add assistant response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.response,
        };

        const finalMessages = [...updatedMessages, assistantMessage];

        // Determine if this is a new chat (no previous messages)
        const isNewChat = chat.messages.length === 0;
        let backendChatId = chatId;

        // Store/update chat in backend first
        try {
          if (isNewChat) {
            // New chat - store it and get the backend chat ID
            const storeResponse = await ChatAPI.storeChat(
              userId,
              finalMessages
            );
            backendChatId = storeResponse.chat_id;

            // Update our local chat with the backend ID and resort
            setChats((prevChats) => {
              const updatedChats = prevChats.map((c) =>
                c.id === chatId
                  ? {
                      ...c,
                      id: backendChatId,
                      messages: finalMessages,
                      updatedAt: new Date(),
                      isLoading: false,
                    }
                  : c
              );
              return sortChatsByMostRecent(updatedChats);
            });

            // Update current chat ID to the backend ID
            setCurrentChatId(backendChatId);
          } else {
            // Existing chat - update it using the existing chat ID
            await ChatAPI.updateChat(userId, chatId, finalMessages);

            // Update local state and resort
            setChats((prevChats) => {
              const updatedChats = prevChats.map((c) =>
                c.id === chatId
                  ? {
                      ...c,
                      messages: finalMessages,
                      updatedAt: new Date(),
                      isLoading: false,
                    }
                  : c
              );
              return sortChatsByMostRecent(updatedChats);
            });
          }
        } catch (apiError) {
          console.error("Failed to sync chat with backend:", apiError);

          // Still update local state even if backend fails and resort
          setChats((prevChats) => {
            const updatedChats = prevChats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    messages: finalMessages,
                    updatedAt: new Date(),
                    isLoading: false,
                  }
                : c
            );
            return sortChatsByMostRecent(updatedChats);
          });

          // Show warning but don't fail completely
          console.warn("Chat saved locally but not synced with server");
        }
      } catch (error) {
        console.error("Failed to send message:", error);

        // Remove loading state and add error
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === chatId ? { ...c, isLoading: false } : c
          )
        );

        // Handle the specific error message you mentioned
        let errorMessage = "Failed to send message";
        if (error instanceof Error) {
          if (error.message.includes("I'm having trouble processing your request")) {
            errorMessage = "I'm having trouble processing your request. Could you please try again?";
          } else if (error.message.includes("timeout")) {
            errorMessage = "The request is taking too long. Please try again.";
          } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "Network connection issue. Please check your internet connection and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, currentChatId, chats, createNewChat]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      if (!userId) {
        console.error("Cannot delete chat: user not authenticated");
        return;
      }

      // Remove from local state immediately for better UX
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }

      // Since there's no delete endpoint, we'll try to "clear" the chat
      // by updating it with empty content as a workaround
      try {
        // Update the chat with empty history to effectively "delete" it
        await ChatAPI.updateChat(userId, chatId, []);
        console.log("Chat cleared on backend:", chatId);
      } catch (error) {
        console.error("Failed to clear chat from backend:", error);
        // Don't restore the chat to local state since deletion UX is more important
        // The user expects the chat to be gone immediately
      }
    },
    [userId, currentChatId]
  );

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
      )
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshChats = useCallback(async () => {
    await loadUserChats();
  }, [loadUserChats]);

  const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

  return {
    chats,
    currentChat,
    isLoading,
    error,
    apiConnected,
    createNewChat,
    selectChat,
    sendMessage,
    deleteChat,
    updateChatTitle,
    clearError,
    refreshChats,
  };
}
