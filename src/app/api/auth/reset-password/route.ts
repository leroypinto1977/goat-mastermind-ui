import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, verificationToken, newPassword } = await request.json();

    if (!email || !verificationToken || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification token, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with matching verification token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: verificationToken,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset tokens
    await (prisma.user.update as any)({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        resetAttempts: 0,
        isFirstLogin: false,
      },
    });

    // Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
