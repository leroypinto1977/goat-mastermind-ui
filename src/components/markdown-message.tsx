import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  isUser: boolean;
  className?: string;
}

export function MarkdownMessage({
  content,
  isUser,
  className,
}: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "bg-muted text-foreground rounded-bl-none",
        className
      )}
    >
      {isUser ? (
        // User messages don't need markdown rendering
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        // Assistant messages with markdown rendering
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
