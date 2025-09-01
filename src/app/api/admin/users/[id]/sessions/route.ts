import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE /api/admin/users/[id]/sessions - Kill all user sessions
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Get user email for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all sessions for the user
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId },
    });

    // Update devices to inactive
    await prisma.device.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: token.id as string,
        action: "SESSIONS_KILLED",
        details: `Killed ${deletedSessions.count} sessions for user ${user.email}`,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      message: `Killed ${deletedSessions.count} sessions`,
      count: deletedSessions.count,
    });
  } catch (error) {
    console.error("Error killing user sessions:", error);
    return NextResponse.json(
      { error: "Failed to kill user sessions" },
      { status: 500 }
    );
  }
}
