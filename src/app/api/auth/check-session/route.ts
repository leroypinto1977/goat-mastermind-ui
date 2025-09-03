import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

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

    console.log("🔍 CheckSession: Device info - IP:", ipAddress, "UA:", userAgent.substring(0, 50));

    // Generate the same fingerprint used during login
    const generateSessionFingerprint = (userAgent: string, ipAddress: string): string => {
      const components = [userAgent, ipAddress].filter(Boolean);
      return Buffer.from(components.join('|')).toString('base64');
    };

    const sessionFingerprint = generateSessionFingerprint(userAgent, ipAddress);
    console.log("🔍 CheckSession: Generated fingerprint:", sessionFingerprint.substring(0, 10) + "...");

    // Check if this device is still active for this user
    const activeDevice = await prisma.device.findFirst({
      where: {
        userId: session.user.id,
        fingerprint: sessionFingerprint,
        isActive: true,
      },
    });

    console.log("🔍 CheckSession: Active device found:", !!activeDevice);

    const isValid = !!activeDevice;
    
    if (!isValid) {
      console.log(`🚫 CheckSession: Session INVALID for user ${session.user.email}`);
      console.log(`🚫 CheckSession: No active device found with fingerprint ${sessionFingerprint.substring(0, 10)}...`);
      
      // List all devices for this user for debugging
      const userDevices = await prisma.device.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          fingerprint: true,
          isActive: true,
          lastActive: true,
          browser: true,
          os: true,
        },
        orderBy: { lastActive: 'desc' },
      });
      
      console.log(`🔍 CheckSession: User has ${userDevices.length} total devices:`);
      userDevices.forEach((device, index) => {
        console.log(`  Device ${index + 1}: ${device.fingerprint.substring(0, 10)}... - Active: ${device.isActive} - ${device.browser} on ${device.os} - Last: ${device.lastActive}`);
      });
      
      // Log this failed check
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SESSION_CHECK_FAILED',
          details: {
            reason: 'Device not active',
            fingerprint: sessionFingerprint.substring(0, 10) + "...",
            ipAddress,
            userAgent: userAgent.substring(0, 100),
            availableDevices: userDevices.length,
            activeDevices: userDevices.filter(d => d.isActive).length,
          },
          ipAddress,
          userAgent,
        },
      });
    } else {
      console.log(`✅ CheckSession: Session VALID for user ${session.user.email}`);
      
      // Update the device's last active time
      await prisma.device.update({
        where: { id: activeDevice.id },
        data: { lastActive: new Date() },
      });
      
      console.log(`✅ CheckSession: Updated device ${activeDevice.id} last active time`);
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
      }
    });
  } catch (error) {
    console.error("❌ CheckSession: Error checking session validity:", error);
    return NextResponse.json(
      { 
        error: "Failed to check session",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
