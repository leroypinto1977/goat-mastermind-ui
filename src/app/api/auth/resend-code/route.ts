import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '@/lib/email-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'UserID does not exist' },
        { status: 404 }
      );
    }

    // Check reset attempts (max 2 resends = 3 total attempts)
    if (user.resetAttempts && user.resetAttempts >= 2) {
      return NextResponse.json(
        { error: 'Maximum resend attempts reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate new 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new code and increment attempts
    await (prisma.user.update as any)({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpires,
        resetAttempts: (user.resetAttempts || 0) + 1,
      },
    });

    // Send email using EmailService
    const emailSent = await EmailService.sendPasswordResetCode(
      email,
      resetCode,
      user.name || undefined
    );

    if (!emailSent) {
      console.error('Failed to send password reset email');
      // Don't return error to avoid leaking user existence
    }

    return NextResponse.json(
      { message: 'Reset code resent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
