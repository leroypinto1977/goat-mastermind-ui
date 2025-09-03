import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email-service";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Get session to ensure user is authenticated
    const session = await auth();

    if (!session?.user?.email) {
      console.error("📧 Test email blocked: User not authenticated");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    console.log("📧 Starting detailed email service test...");
    console.log("📧 Test initiated by:", session.user.email);

    // Log configuration details
    EmailService.logEmailConfiguration();

    // Test with user's email
    const testEmail = session.user.email;
    console.log("📧 Sending test email to:", testEmail);

    const result = await EmailService.sendTestEmail(testEmail);

    if (result) {
      console.log("📧 ✅ Email service test completed successfully");
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("📧 ❌ Email service test failed");
      return NextResponse.json(
        {
          success: false,
          error: "Email service test failed - check server logs for details",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("📧 ❌ Email service test endpoint error:", error);
    console.error("📧 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during email test",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      console.error("📧 Test email blocked: User not authenticated");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testType = "basic", recipientEmail } = body;

    const targetEmail = recipientEmail || session.user.email;
    console.log(`📧 Starting ${testType} email test to:`, targetEmail);

    let result = false;

    switch (testType) {
      case "welcome":
        console.log("📧 Testing welcome email...");
        result = await EmailService.sendWelcomeEmail(
          targetEmail,
          "TempPass123!",
          session.user.name || "Test User"
        );
        break;

      case "password-reset":
        console.log("📧 Testing password reset email...");
        result = await EmailService.sendPasswordResetCode(
          targetEmail,
          "123456",
          session.user.name || "Test User"
        );
        break;

      case "basic":
      default:
        console.log("📧 Testing basic email...");
        result = await EmailService.sendTestEmail(targetEmail);
        break;
    }

    if (result) {
      console.log(`📧 ✅ ${testType} email test completed successfully`);
      return NextResponse.json({
        success: true,
        message: `${testType} test email sent successfully to ${targetEmail}`,
        testType,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`📧 ❌ ${testType} email test failed`);
      return NextResponse.json(
        {
          success: false,
          error: `${testType} email test failed - check server logs for details`,
          testType,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("📧 ❌ Email service POST test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during email test",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
