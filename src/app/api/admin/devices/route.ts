import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastActive: "desc",
      },
    });

    return NextResponse.json({ devices });
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
        action: "DEVICE_TERMINATED",
        details: `Admin terminated device ${deviceId}`,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error terminating device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
