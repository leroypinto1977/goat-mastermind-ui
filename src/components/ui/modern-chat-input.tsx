"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";

interface ModernChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ModernChatInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder = "Type your message...",
  disabled = false,
  loading = false,
  className,
}: ModernChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 160; // 10 lines max
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + "px";
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled || loading) return;
    onSubmit();
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-goat-brown/20 via-goat-brown/10 to-goat-brown/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300" />

      {/* Main input container */}
      <div className="relative bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg group-focus-within:shadow-2xl group-focus-within:border-goat-brown/30 transition-all duration-300 overflow-hidden">
        {/* Animated border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-goat-brown/30 via-transparent to-goat-brown/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative flex items-end gap-3 p-4">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onInput={adjustHeight}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
                "border-none outline-none focus:ring-0",
                "text-base leading-6",
                "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                minHeight: "24px",
                maxHeight: "160px",
              }}
            />

            {/* Placeholder enhancement */}
            {!value && (
              <div className="absolute inset-0 flex items-start pt-0 pointer-events-none">
                <span className="text-muted-foreground/60 text-base select-none">
                  {placeholder}
                </span>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled || loading}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
              "bg-goat-brown text-white shadow-md",
              "hover:bg-goat-brown-dark hover:shadow-lg hover:scale-105",
              "active:scale-95 active:shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-goat-brown/50 focus:ring-offset-2 focus:ring-offset-background"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-goat-brown/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Character count and keyboard shortcuts */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
          <span>Enter to send</span>
          <span>Cmd+Enter for new line</span>
        </div>

        {value && (
          <div className="text-xs text-muted-foreground/60">
            {value.length} characters
          </div>
        )}
      </div>
    </div>
  );
}
