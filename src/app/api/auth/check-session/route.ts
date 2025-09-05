import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { DeviceTracker } from "@/lib/device-tracker";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    console.log("🔍 CheckSession: Checking session for request");

    if (!session?.user?.id) {
      console.log("🚫 CheckSession: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 CheckSession: Session found for user:", session.user.email);

    // Get device information from request headers
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    console.log(
      "🔍 CheckSession: Device info - IP:",
      ipAddress,
      "UA:",
      userAgent.substring(0, 50)
    );

    // Use the same fingerprint generation method as DeviceTracker
    const sessionFingerprint = DeviceTracker.generateSessionFingerprint({
      userAgent,
      ipAddress,
    } as any);

    console.log(
      "🔍 CheckSession: Generated fingerprint:",
      sessionFingerprint.substring(0, 10) + "..."
    );

    // Check if this device exists and is active for this user
    // Note: Relaxed session validation - allowing multiple active sessions
    const activeDevice = await prisma.device.findFirst({
      where: {
        userId: session.user.id,
        fingerprint: sessionFingerprint,
        isActive: true,
      },
    });

    console.log("🔍 CheckSession: Active device found:", !!activeDevice);

    // For now, always consider session valid if device exists
    // This removes the aggressive session termination behavior
    let isValid = !!activeDevice;

    if (activeDevice) {
      // Update the device's last active time
      await prisma.device.update({
        where: { id: activeDevice.id },
        data: { lastActive: new Date() },
      });

      console.log(
        `✅ CheckSession: Updated device ${activeDevice.id} last active time`
      );
    } else {
      // If device not found, it might be a timing issue
      // Instead of immediately failing, log but don't terminate
      console.log(
        `⚠️ CheckSession: Device not found but allowing session to continue for user ${session.user.email}`
      );
      
      // Still return valid to prevent aggressive logout
      isValid = true;
    }

    return NextResponse.json({
      isValid,
      message: isValid ? "Session is valid" : "Session has been terminated",
      debug: {
        userId: session.user.id,
        email: session.user.email,
        fingerprint: sessionFingerprint.substring(0, 10) + "...",
        deviceFound: !!activeDevice,
        deviceId: activeDevice?.id || null,
      },
    });
  } catch (error) {
    console.error("❌ CheckSession: Error checking session validity:", error);
    return NextResponse.json(
      {
        error: "Failed to check session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
