"use client";

import { useDeviceTracking } from "@/hooks/use-device-tracking";
import { useEffect } from "react";

export function DeviceTracker() {
  const { deviceTracked, sessionEnforced, error, retryTracking } = useDeviceTracking();

  useEffect(() => {
    if (deviceTracked) {
      console.log("🎯 Device tracking completed successfully");
      if (sessionEnforced) {
        console.log("🔒 Session limit enforced - previous sessions terminated");
      }
    }

    if (error) {
      console.error("❌ Device tracking failed:", error);
      // Retry once after 2 seconds if there was an error
      setTimeout(retryTracking, 2000);
    }
  }, [deviceTracked, sessionEnforced, error, retryTracking]);

  // This component doesn't render anything visible
  // It just handles device tracking in the background
  return null;
}
