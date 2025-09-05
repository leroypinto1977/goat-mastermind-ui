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
    await DeviceTracker.updateDeviceActivity(
      session.user.id,
      ipAddress,
      userAgent
    );

    // Check for active devices
    const activeDevicesCount = await DeviceTracker.getActiveDevicesCount(
      session.user.id
    );

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

// Force terminate other sessions - DISABLED
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Session enforcement disabled - allowing multiple sessions
    console.log("📝 Session termination disabled - multiple sessions allowed");

    return NextResponse.json({
      success: true,
      terminatedSessions: 0,
      message: "Session enforcement is currently disabled - multiple sessions are allowed",
      multipleSessionsAllowed: true,
    });
  } catch (error) {
    console.error("Error in session check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
