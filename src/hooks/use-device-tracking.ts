"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface DeviceTrackingResult {
  deviceTracked: boolean;
  sessionEnforced: boolean;
  error?: string;
}

export function useDeviceTracking() {
  const { data: session, status } = useSession();
  const [trackingResult, setTrackingResult] = useState<DeviceTrackingResult>({
    deviceTracked: false,
    sessionEnforced: false,
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      trackDevice();
    }
  }, [session, status]);

  const trackDevice = async () => {
    try {
      console.log("🚀 Starting device tracking for:", session?.user?.email);
      
      const response = await fetch("/api/auth/track-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Device tracking successful:", result);
        setTrackingResult({
          deviceTracked: true,
          sessionEnforced: result.sessionEnforced,
        });

        // Show session enforcement notification if needed
        if (result.sessionEnforced) {
          // This will be handled by the SessionLimitNotification component
          localStorage.removeItem("sessionLimitNotificationShown");
        }
      } else {
        console.error("❌ Device tracking failed:", result);
        setTrackingResult({
          deviceTracked: false,
          sessionEnforced: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("❌ Device tracking error:", error);
      setTrackingResult({
        deviceTracked: false,
        sessionEnforced: false,
        error: "Network error",
      });
    }
  };

  return {
    ...trackingResult,
    retryTracking: trackDevice,
  };
}
