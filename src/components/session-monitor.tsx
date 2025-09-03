"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Date>(new Date());
  const isCheckingRef = useRef<boolean>(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      console.log(
        "🎯 SessionMonitor: Starting session monitoring for",
        session.user.email
      );

      // Check session validity every 10 seconds (more frequent)
      intervalRef.current = setInterval(() => {
        if (!isCheckingRef.current) {
          checkSessionValidity();
        }
      }, 10000);

      // Also check when the page becomes visible again
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Initial check after 2 seconds
      setTimeout(() => {
        if (!isCheckingRef.current) {
          checkSessionValidity();
        }
      }, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    } else {
      console.log("🎯 SessionMonitor: Not authenticated, stopping monitoring");
    }
  }, [session, status]);

  const handleVisibilityChange = () => {
    if (!document.hidden && session?.user?.id && !isCheckingRef.current) {
      console.log("🎯 SessionMonitor: Page became visible, checking session");
      checkSessionValidity();
    }
  };

  const checkSessionValidity = async () => {
    if (!session?.user?.id || isCheckingRef.current) return;

    isCheckingRef.current = true;

    try {
      lastCheckRef.current = new Date();
      console.log("🔍 SessionMonitor: Checking session validity...");

      const response = await fetch("/api/auth/check-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin", // Ensure cookies are sent
      });

      console.log("🔍 SessionMonitor: Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 SessionMonitor: Session check result:", result);

        if (!result.isValid) {
          console.log("🚫 SessionMonitor: Session terminated, signing out...");

          // Clear any local storage
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          // Force immediate signout
          await signOut({
            callbackUrl: "/auth/signin?message=session-terminated",
            redirect: false, // Handle redirect manually
          });

          // Manual redirect as fallback
          window.location.href = "/auth/signin?message=session-terminated";
        } else {
          console.log("✅ SessionMonitor: Session is valid");
        }
      } else if (response.status === 401) {
        console.log("🚫 SessionMonitor: Unauthorized (401), signing out...");

        // Clear storage
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        await signOut({
          callbackUrl: "/auth/signin?message=session-expired",
          redirect: false,
        });

        // Force redirect
        window.location.href = "/auth/signin?message=session-expired";
      } else {
        console.log(
          "⚠️ SessionMonitor: Unexpected response status:",
          response.status
        );
      }
    } catch (error) {
      console.error(
        "❌ SessionMonitor: Error checking session validity:",
        error
      );

      // On network errors, try one more time after a short delay
      setTimeout(() => {
        if (session?.user?.id) {
          console.log(
            "🔄 SessionMonitor: Retrying session check after error..."
          );
          isCheckingRef.current = false;
          checkSessionValidity();
        }
      }, 3000);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // This component doesn't render anything
  return null;
}
