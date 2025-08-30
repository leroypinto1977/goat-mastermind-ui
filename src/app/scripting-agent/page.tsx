"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
};

export default function ScriptingAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const conversations: Conversation[] = [
    {
      id: "1",
      title: "New conversation",
      lastMessage: "Hello! How can I help you today?",
      timestamp: new Date(),
    },
    {
      id: "2",
      title: "Script ideas",
      lastMessage: "Here are some script ideas...",
      timestamp: new Date(Date.now() - 3600000),
    },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm your Scripting Agent. You said: "${input}"`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
          {/* New Chat Button */}
          <div className="p-4 border-b border-border">
            <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{conversation.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  User
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Free Plan
                </p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
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
              Scripting Agent
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-2 text-foreground">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground mb-8">
                Ask me anything about scripting, coding, or automation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {[
                  "Write a short form script for a tech company",
                  "Write a short form script for a tech company",
                  "Write a short form script for a tech company",
                  "Write a short form script for a tech company",
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      message.isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
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
                placeholder="Message Scripting Agent..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent text-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Scripting Agent can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
