"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ModernChatInput } from "@/components/ui/modern-chat-input";
import {
  Plus,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "@/hooks/useChat";
import { MarkdownMessage } from "@/components/markdown-message";
import { DeleteChatModal } from "@/components/delete-chat-modal";
import { buttonPresets, buttonAnimations } from "@/lib/button-animations";
import { GoatLogo } from "@/components/goat-logo";

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
    showActionButtons,
    createNewChat,
    selectChat,
    sendMessage,
    deleteChat,
    clearError,
    refreshChats,
    hideActionButtons,
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Command/Ctrl)
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && session && apiConnected) {
        handleSendMessage();
      }
    }
    // Allow new line on Command+Enter, Ctrl+Enter, or Shift+Enter
    // These combinations will naturally create new lines, so we don't prevent default
  };

  const handlePlusClick = () => {
    // Handle plus button functionality - you can customize this based on your needs
    console.log("Plus button clicked");
    // For example, you could open a file picker, show options menu, etc.
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
              <GoatLogo size="md" variant="full" />
            </div>
          </div>

          {/* API Status - Hidden for now */}
          {/* <div className="px-4 py-2 border-b border-border">
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
          </div> */}

          {/* New Chat Button */}
          <div className="p-4 border-b border-border">
            <Button
              onClick={handleNewChat}
              className={`w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground ${buttonPresets.primary}`}
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
                  className={`h-6 px-2 mt-2 text-xs ${buttonAnimations.subtle}`}
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
                  </div>
                  {chat.isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                  )}
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
            {/* <GoatLogo size="md" /> */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md"
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
            {/* Reload button - Hidden for now */}
            {/* <Button
              onClick={refreshChats}
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 ${buttonPresets.icon}`}
              disabled={isLoading}
            >
              <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button> */}
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
                  "Create from scratch",
                  "Create from existing",
                  // "Help me debug a JavaScript function",
                  // "Generate a PowerShell script for user management",
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
        <div className="bg-gradient-to-t from-background/95 to-background/60 backdrop-blur-sm p-4 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            {/* Action Buttons */}
            {showActionButtons && (
              <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-center animate-in slide-in-from-bottom-2 duration-300">
                <Button
                  onClick={() => {
                    // Handle "Create from Scratch" action
                    setInput("Create from Scratch");
                  }}
                  variant="outline"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 hover:bg-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md min-w-fit"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Create from Scratch</span>
                </Button>
                <Button
                  onClick={() => {
                    // Handle "Create from Existing" action
                    setInput("Create from Existing");
                  }}
                  variant="outline"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 hover:bg-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md min-w-fit"
                >
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Create from Existing</span>
                </Button>
              </div>
            )}

            <ModernChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              onKeyDown={handleKeyDown}
              onPlusClick={handlePlusClick}
              placeholder={
                !session
                  ? "Please sign in to start chatting..."
                  : !apiConnected
                    ? "API not connected..."
                    : "Message Scripting Agent..."
              }
              disabled={isLoading || !session || !apiConnected}
              loading={isLoading}
            />

            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground/80">
                Scripting Agent can make mistakes. Consider checking important
                information.
              </p>
            </div>
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
