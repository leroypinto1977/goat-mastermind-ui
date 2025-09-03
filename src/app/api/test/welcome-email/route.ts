import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Send welcome email with test credentials
    const testPassword = "TempPass123!";
    const emailSent = await EmailService.sendWelcomeEmail(
      email,
      testPassword,
      name || "Test User"
    );

    if (emailSent) {
      return NextResponse.json(
        {
          message: "Welcome email sent successfully",
          tempPassword: testPassword, // Only for testing
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Welcome email test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
