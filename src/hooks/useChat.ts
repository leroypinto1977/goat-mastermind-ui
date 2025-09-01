import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatMessage, ChatAPI } from '../lib/chat-api';

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

const generateChatId = () => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateChatTitle = (firstMessage: string): string => {
  if (firstMessage.length <= 50) return firstMessage;
  return firstMessage.substring(0, 47) + '...';
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
      
      const loadedChats: Chat[] = response.chats.map((chat: any) => ({
        id: chat.chat_id,
        title: chat.chat_history.length > 0 
          ? generateChatTitle(chat.chat_history[0].content)
          : 'Empty Chat',
        messages: chat.chat_history,
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at),
      }));

      setChats(loadedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chats');
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
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(chatId);
    return chatId;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    let chatId = currentChatId;
    
    // Create new chat if none selected
    if (!chatId) {
      chatId = createNewChat();
    }

    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      setError('Chat not found');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    const updatedMessages = [...chat.messages, userMessage];

    // Update chat with user message and set loading
    setChats((prevChats) => 
      prevChats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: updatedMessages,
              title: c.messages.length === 0 ? generateChatTitle(message) : c.title,
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
        role: 'assistant', 
        content: response.response 
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];

      // Update chat with assistant response
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: finalMessages,
                updatedAt: new Date(),
                isLoading: false,
              }
            : c
        )
      );

      // Store/update chat in backend
      try {
        if (chat.messages.length === 0) {
          // New chat - store it
          await ChatAPI.storeChat(userId, finalMessages);
        } else {
          // Existing chat - update it
          await ChatAPI.updateChat(userId, chatId, finalMessages);
        }
      } catch (apiError) {
        console.error('Failed to sync chat with backend:', apiError);
        // Continue anyway - we have local state
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove loading state and add error
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? { ...c, isLoading: false }
            : c
        )
      );
      
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentChatId, chats, createNewChat]);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

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
