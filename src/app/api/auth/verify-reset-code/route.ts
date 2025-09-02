import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Find user with matching email and reset code
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: code,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    }) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Generate a temporary verification token for password reset
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Store verification token (we'll use this to verify the password reset)
    await (prisma.user.update as any)({
      where: { id: user.id },
      data: {
        resetToken: verificationToken, // Replace reset code with verification token
        resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes to change password
      },
    });

    return NextResponse.json(
      { 
        message: 'Code verified successfully',
        verificationToken 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
