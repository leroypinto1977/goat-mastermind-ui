"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "@/hooks/useChat";
import { MarkdownMessage } from "@/components/markdown-message";
import { DeleteChatModal } from "@/components/delete-chat-modal";

export default function ScriptingAgentPage() {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chats,
    currentChat,
    isLoading,
    error,
    apiConnected,
    createNewChat,
    selectChat,
    sendMessage,
    deleteChat,
    clearError,
    refreshChats,
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleNewChat = () => {
    createNewChat();
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();

    const chatToDeleteData = chats.find((c) => c.id === chatId);
    if (chatToDeleteData) {
      setChatToDelete({
        id: chatId,
        title: chatToDeleteData.title,
      });
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      console.log("Deleting chat:", chatToDelete.id);
      deleteChat(chatToDelete.id);
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setChatToDelete(null);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out z-10 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-lg">
                  G
                </div>
                <span className="text-foreground">GOAT AI</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs">
              {apiConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">API Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">API Offline</span>
                </>
              )}
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-border">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!session}
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error</span>
                </div>
                <p className="text-destructive text-xs">{error}</p>
                <Button
                  onClick={clearError}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 mt-2 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-2 text-sm cursor-pointer transition-colors",
                    currentChat?.id === chat.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{chat.title}</span>
                    {chat.isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin mt-1" />
                    )}
                  </div>
                  <Button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {session?.user?.name || session?.user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Free Plan
                </p>
              </div>
              <Button
                onClick={() => signOut()}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-card p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              {currentChat?.title || "Scripting Agent"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshChats}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-2 text-foreground">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground mb-8">
                Ask me anything about scripting, coding, or automation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {[
                  "Write a Python script to automate file organization",
                  "Create a bash script for system monitoring",
                  "Help me debug a JavaScript function",
                  "Generate a PowerShell script for user management",
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    className="p-4 border border-border rounded-lg text-left hover:bg-muted transition-colors text-sm text-foreground"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <MarkdownMessage
                    content={message.content}
                    isUser={message.role === "user"}
                  />
                </div>
              ))}
              {currentChat.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-card p-4 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="flex items-end gap-2 border border-border rounded-xl p-1.5 bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !session
                    ? "Please sign in to start chatting..."
                    : !apiConnected
                    ? "API not connected..."
                    : "Message Scripting Agent..."
                }
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent text-foreground"
                disabled={isLoading || !session || !apiConnected}
              />
              <Button
                type="submit"
                size="icon"
                disabled={
                  isLoading || !input.trim() || !session || !apiConnected
                }
                className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Scripting Agent can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Chat Modal */}
      <DeleteChatModal
        isOpen={deleteModalOpen}
        chatTitle={chatToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
