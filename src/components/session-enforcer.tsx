"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

export function SessionEnforcer() {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasValidRef = useRef<boolean>(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      console.log("🛡️ SessionEnforcer: Starting aggressive session monitoring");

      // Check every 5 seconds - very aggressive
      checkIntervalRef.current = setInterval(() => {
        if (!isChecking) {
          checkSessionAggressively();
        }
      }, 5000);

      // Initial check
      setTimeout(() => checkSessionAggressively(), 1000);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [session, status, isChecking]);

  const checkSessionAggressively = async () => {
    if (!session?.user?.id || isChecking) return;

    setIsChecking(true);

    try {
      console.log("🛡️ SessionEnforcer: Aggressive check starting...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("/api/auth/check-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        credentials: "same-origin",
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        if (!result.isValid && wasValidRef.current) {
          // Session was valid before but now it's not - immediate action
          console.log(
            "🚫 SessionEnforcer: Session terminated! Forcing logout..."
          );
          wasValidRef.current = false;

          // Show immediate toast
          toast.error(
            "Your session has been terminated by an administrator or due to multiple logins. Redirecting to login...",
            {
              duration: 10000,
              position: "top-center",
            }
          );

          // Clear all storage immediately
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          // Force logout after 2 seconds
          setTimeout(async () => {
            try {
              await signOut({
                callbackUrl: "/auth/signin?message=session-terminated",
                redirect: false,
              });
            } catch (error) {
              console.error("Error during signOut:", error);
            }

            // Force redirect regardless
            window.location.replace("/auth/signin?message=session-terminated");
          }, 2000);
        } else if (result.isValid) {
          wasValidRef.current = true;
          console.log("✅ SessionEnforcer: Session is valid");
        }
      } else if (response.status === 401) {
        console.log("🚫 SessionEnforcer: Unauthorized response");
        if (wasValidRef.current) {
          wasValidRef.current = false;
          forceLogout("Unauthorized session");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("⚠️ SessionEnforcer: Request timeout");
      } else {
        console.error("❌ SessionEnforcer: Error:", error);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const forceLogout = async (reason: string) => {
    console.log("🚫 SessionEnforcer: Force logout -", reason);

    toast.error(`Session terminated: ${reason}. Redirecting...`, {
      duration: 5000,
      position: "top-center",
    });

    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    setTimeout(() => {
      window.location.replace("/auth/signin?message=session-terminated");
    }, 1000);
  };

  return null;
}
