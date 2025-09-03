import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all devices with user information
    const devices = await prisma.device.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: {
        lastActive: "desc",
      },
    });

    // Format devices for admin display
    const formattedDevices = devices.map(device => ({
      id: device.id,
      deviceName: device.deviceName || "Unknown Device",
      deviceType: device.deviceType || "desktop",
      browser: device.browser || "Unknown Browser",
      os: device.os || "Unknown OS",
      ipAddress: device.ipAddress || "Unknown IP",
      isActive: device.isActive,
      lastActive: device.lastActive.toISOString(),
      createdAt: device.createdAt.toISOString(),
      user: {
        id: device.user.id,
        email: device.user.email,
        name: device.user.name,
        role: device.user.role,
        lastLoginAt: device.user.lastLoginAt?.toISOString() || null,
      },
      fingerprint: device.fingerprint.substring(0, 8) + "...", // Truncate for display
    }));

    return NextResponse.json({ 
      devices: formattedDevices,
      summary: {
        total: devices.length,
        active: devices.filter(d => d.isActive).length,
        inactive: devices.filter(d => !d.isActive).length,
        uniqueUsers: new Set(devices.map(d => d.userId)).size,
      }
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Terminate device session
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("id");

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID required" },
        { status: 400 }
      );
    }

    // Get device info before terminating
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Deactivate the device
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        isActive: false,
        lastActive: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DEVICE_TERMINATED_BY_ADMIN",
        details: {
          deviceId,
          terminatedDevice: {
            deviceName: device.deviceName,
            deviceType: device.deviceType,
            browser: device.browser,
            os: device.os,
            ipAddress: device.ipAddress,
            user: device.user.email,
          },
          terminatedBy: session.user.email,
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: `Device terminated for user ${device.user.email}`,
      device: {
        id: deviceId,
        deviceName: device.deviceName,
        user: device.user.email,
      }
    });
  } catch (error) {
    console.error("Error terminating device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
