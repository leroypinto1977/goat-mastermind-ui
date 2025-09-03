"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface SessionNotification {
  show: boolean;
  message: string;
  type: "info" | "warning" | "success";
}

export function SessionLimitNotification() {
  const { data: session, status } = useSession();
  const [notification, setNotification] = useState<SessionNotification>({
    show: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      // Check if we should show the session limit notification
      checkForSessionNotification();

      // Check session status periodically
      const interval = setInterval(checkForSessionNotification, 30000);

      return () => clearInterval(interval);
    }
  }, [session, status]);

  const checkForSessionNotification = async () => {
    try {
      // Check if notification was already shown for this session
      const notificationKey = `sessionNotification_${session?.user?.id}`;
      const alreadyShown = localStorage.getItem(notificationKey);

      if (alreadyShown) {
        return;
      }

      // Show notification about session enforcement
      setNotification({
        show: true,
        message:
          "Session security active: Only one device can be logged in at a time. Any previous sessions have been automatically terminated for your security.",
        type: "info",
      });

      // Mark as shown for this session
      localStorage.setItem(notificationKey, "true");

      // Auto-hide after 8 seconds
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 8000);
    } catch (error) {
      console.error("Error checking session notification:", error);
    }
  };

  const dismissNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  if (!notification.show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
          notification.type === "info"
            ? "border-blue-200 bg-blue-50/90 text-blue-800 dark:border-blue-800 dark:bg-blue-950/90 dark:text-blue-200"
            : notification.type === "warning"
              ? "border-orange-200 bg-orange-50/90 text-orange-800 dark:border-orange-800 dark:bg-orange-950/90 dark:text-orange-200"
              : "border-green-200 bg-green-50/90 text-green-800 dark:border-green-800 dark:bg-green-950/90 dark:text-green-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {notification.type === "info" && (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.type === "warning" && (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.type === "success" && (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={dismissNotification}
            className="flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
