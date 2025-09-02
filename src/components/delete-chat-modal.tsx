import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { buttonPresets } from "@/lib/button-animations";

interface DeleteChatModalProps {
  isOpen: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteChatModal({
  isOpen,
  chatTitle,
  onConfirm,
  onCancel,
}: DeleteChatModalProps) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onCancel]);
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Delete Chat
              </h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-muted ${buttonPresets.icon}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-sm text-foreground leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">"{chatTitle}"</span>?{" "}
            All messages in this conversation will be permanently removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/30 rounded-b-lg">
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className={`h-9 ${buttonPresets.secondary}`}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            size="sm"
            className={`h-9 ${buttonPresets.destructive}`}
          >
            Delete Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
