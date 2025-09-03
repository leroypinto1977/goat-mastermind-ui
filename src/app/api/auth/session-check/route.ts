import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DeviceTracker } from "@/lib/device-tracker";

// Check for session conflicts and return notification data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get device info from request
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress = 
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    // Update device activity
    await DeviceTracker.updateDeviceActivity(session.user.id, ipAddress, userAgent);

    // Check for active devices
    const activeDevicesCount = await DeviceTracker.getActiveDevicesCount(session.user.id);

    return NextResponse.json({
      success: true,
      activeDevicesCount,
      sessionLimitEnforced: true,
      maxSessions: 1,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Force terminate other sessions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const terminatedCount = await DeviceTracker.enforceSessionLimit(session.user.id, 1);

    return NextResponse.json({
      success: true,
      terminatedSessions: terminatedCount,
      message: terminatedCount > 0 
        ? `${terminatedCount} previous session(s) terminated due to session limit`
        : "No sessions needed termination",
    });
  } catch (error) {
    console.error("Error enforcing session limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
