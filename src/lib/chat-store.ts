import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatAPI } from './chat-api';

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isLoading?: boolean;
}

interface ChatStore {
  // State
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  userId: string | null;
  apiConnected: boolean;

  // Actions
  setUserId: (userId: string) => void;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  loadUserChats: () => Promise<void>;
  deleteChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  checkApiConnection: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  getCurrentChat: () => Chat | null;
  getChatById: (chatId: string) => Chat | null;
}

const generateChatId = () => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateChatTitle = (firstMessage: string): string => {
  if (firstMessage.length <= 50) return firstMessage;
  return firstMessage.substring(0, 47) + '...';
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      chats: [],
      currentChatId: null,
      isLoading: false,
      error: null,
      userId: null,
      apiConnected: false,

      // Actions
      setUserId: (userId: string) => {
        set({ userId });
        // Load chats when user is set
        get().loadUserChats();
        get().checkApiConnection();
      },

      createNewChat: () => {
        const chatId = generateChatId();
        const newChat: Chat = {
          id: chatId,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: chatId,
        }));

        return chatId;
      },

      selectChat: (chatId: string) => {
        set({ currentChatId: chatId });
      },

      sendMessage: async (message: string) => {
        const { userId, currentChatId, chats } = get();
        
        if (!userId) {
          set({ error: 'User not authenticated' });
          return;
        }

        let chatId = currentChatId;
        
        // Create new chat if none selected
        if (!chatId) {
          chatId = get().createNewChat();
        }

        const chat = get().getChatById(chatId);
        if (!chat) {
          set({ error: 'Chat not found' });
          return;
        }

        // Add user message
        const userMessage: ChatMessage = { role: 'user', content: message };
        const updatedMessages = [...chat.messages, userMessage];

        // Update chat with user message and set loading
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: updatedMessages,
                  title: c.messages.length === 0 ? generateChatTitle(message) : c.title,
                  updatedAt: new Date(),
                  isLoading: true,
                }
              : c
          ),
          isLoading: true,
          error: null,
        }));

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
          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    messages: finalMessages,
                    updatedAt: new Date(),
                    isLoading: false,
                  }
                : c
            ),
            isLoading: false,
          }));

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
          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chatId
                ? { ...c, isLoading: false }
                : c
            ),
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to send message',
          }));
        }
      },

      loadUserChats: async () => {
        const { userId } = get();
        if (!userId) return;

        set({ isLoading: true, error: null });

        try {
          const response = await ChatAPI.fetchChats(userId);
          
          const loadedChats: Chat[] = response.chats.map((chat) => ({
            id: chat.chat_id,
            title: chat.chat_history.length > 0 
              ? generateChatTitle(chat.chat_history[0].content)
              : 'Empty Chat',
            messages: chat.chat_history,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at),
          }));

          set({ chats: loadedChats, isLoading: false });
        } catch (error) {
          console.error('Failed to load chats:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load chats',
            isLoading: false 
          });
        }
      },

      deleteChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }));
      },

      updateChatTitle: (chatId: string, title: string) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
          ),
        }));
      },

      checkApiConnection: async () => {
        try {
          const connected = await ChatAPI.checkHealth();
          set({ apiConnected: connected });
        } catch (error) {
          set({ apiConnected: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Getters
      getCurrentChat: () => {
        const { chats, currentChatId } = get();
        return chats.find((chat) => chat.id === currentChatId) || null;
      },

      getChatById: (chatId: string) => {
        const { chats } = get();
        return chats.find((chat) => chat.id === chatId) || null;
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        userId: state.userId,
      }),
    }
  )
);
