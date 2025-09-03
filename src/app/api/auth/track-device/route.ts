import { NextRequest, NextResponse } from "next/server";
import { DeviceTracker } from "@/lib/device-tracker";
import { auth } from "@/lib/auth";

// This endpoint will be called immediately after successful login to track the device
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get device information from request headers
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress = 
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    console.log("🔍 Tracking device for user:", session.user.email);
    console.log("📱 Device info:", { userAgent: userAgent.substring(0, 50) + "...", ipAddress });

    // Track the device and enforce session limits
    const deviceId = await DeviceTracker.trackDevice(session.user.id, {
      userAgent,
      ipAddress,
    });

    console.log("✅ Device tracked successfully:", deviceId);

    return NextResponse.json({
      success: true,
      deviceId,
      message: "Device tracked successfully",
      sessionEnforced: true,
    });
  } catch (error) {
    console.error("❌ Error tracking device:", error);
    return NextResponse.json(
      { 
        error: "Failed to track device",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
