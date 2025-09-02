import { Resend } from "resend";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/emails/password-reset-email";
import { WelcomeEmail } from "@/emails/welcome-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  static async sendEmail({
    to,
    subject,
    html,
    text,
  }: EmailOptions): Promise<boolean> {
    let emailData: any = null;

    try {
      if (!process.env.RESEND_API_KEY) {
        console.log("⚠️  No RESEND_API_KEY found, simulating email send");
        console.log(`📧 [SIMULATED] To: ${to}`);
        console.log(`📧 [SIMULATED] Subject: ${subject}`);
        console.log(`📧 [SIMULATED] Content: ${text || html}`);
        return true;
      }

      emailData = {
        from:
          process.env.RESEND_FROM_EMAIL ||
          "GOAT Mastermind <onboarding@resend.dev>",
        to: [to],
        subject,
      };

      if (html) {
        emailData.html = html;
      }
      if (text) {
        emailData.text = text;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error("❌ Email send failed");
        console.error("📧 Failed email details:", {
          to,
          subject,
          from: emailData.from,
          timestamp: new Date().toISOString(),
        });
        console.error("📧 Resend API error:", error);
        console.error("📧 Error type:", typeof error);
        console.error("📧 Full error object:", JSON.stringify(error, null, 2));
        return false;
      }

      console.log("✅ Email sent successfully:", data?.id);
      return true;
    } catch (error) {
      console.error("❌ Email service error (catch block)");
      console.error("📧 Failed email details:", {
        to,
        subject,
        from: emailData?.from || "unknown",
        timestamp: new Date().toISOString(),
      });
      console.error("📧 Caught error:", error);
      console.error(
        "📧 Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(
        "📧 Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("📧 Full error object:", JSON.stringify(error, null, 2));
      return false;
    }
  }

  static async sendPasswordResetCode(
    email: string,
    code: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const subject = "Password Reset Code - GOAT Mastermind";

      // Render the React Email template
      const emailHtml = await render(
        PasswordResetEmail({
          userName,
          resetCode: code,
          validMinutes: 10,
        })
      );

      // Create plain text version
      const emailText = `
GOAT Mastermind - Password Reset Code

Hello${userName ? ` ${userName}` : ""},

You requested a password reset for your GOAT Mastermind account.

Your verification code is: ${code}

Important:
- This code expires in 10 minutes
- You can request up to 2 additional codes if needed
- If you didn't request this reset, please ignore this email
- For security, never share this code with anyone

Enter this code in the verification screen to proceed with resetting your password.

Best regards,
The GOAT Mastermind Team

---
This email was sent from GOAT Mastermind security system.
Please do not reply to this email.
      `;

      const emailResult = await this.sendEmail({
        to: email,
        subject,
        html: emailHtml,
        text: emailText,
      });

      // If email failed to send, log the verification code for development
      if (!emailResult) {
        console.error('🚨 EMAIL DELIVERY FAILED - Verification Code Details:');
        console.error(`📧 Recipient: ${email}`);
        console.error(`🔑 Verification Code: ${code}`);
        console.error(`⏰ Code expires in: 10 minutes`);
        console.error(`👤 User: ${userName || 'Unknown'}`);
        console.error(`🕐 Generated at: ${new Date().toISOString()}`);
        console.error('⚠️  IMPORTANT: This code is logged due to email delivery failure.');
        console.error('⚠️  In production, ensure email service is properly configured.');
      }

      return emailResult;
    } catch (error) {
      console.error("❌ Error in sendPasswordResetCode method");
      console.error("📧 Password reset email details:", {
        email,
        code: code.substring(0, 2) + "****", // Partially mask the code for security
        userName,
        timestamp: new Date().toISOString(),
      });
      console.error("📧 Error during email rendering/sending:", error);
      console.error(
        "📧 Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(
        "📧 Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      
      // Also log the verification code when there's a rendering/sending error
      console.error('🚨 EXCEPTION IN PASSWORD RESET EMAIL - Verification Code:');
      console.error(`🔑 Code: ${code}`);
      console.error(`📧 For: ${email}`);
      
      return false;
    }
  }

  static async sendWelcomeEmail(
    email: string,
    tempPassword: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const subject = "Welcome to GOAT Mastermind - Your Account Details";

      // Render the React Email template
      const emailHtml = await render(
        WelcomeEmail({
          userName,
          email,
          tempPassword,
        })
      );

      // Create plain text version
      const emailText = `
GOAT Mastermind - Welcome & Account Details

Hello${userName ? ` ${userName}` : ""},

Welcome to GOAT Mastermind! Your account has been created successfully.

Your Login Credentials:
- Email: ${email}
- Temporary Password: ${tempPassword}

SECURITY NOTICE:
- This is a temporary password
- You'll be prompted to change it on your first login  
- Please choose a strong password for your security
- Keep your login credentials secure

Sign in at: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin

What you can do with GOAT Mastermind:
📈 Advanced Analytics
🤖 AI-Powered Insights  
⚡ Lightning Fast Performance

If you have any questions, please contact our support team at support@goatmastermind.com.

Welcome aboard!
The GOAT Mastermind Team

---
This email was sent from GOAT Mastermind account system.
Please do not reply to this email.
      `;

      const emailResult = await this.sendEmail({
        to: email,
        subject,
        html: emailHtml,
        text: emailText,
      });

      // If email failed to send, log the temporary password for development
      if (!emailResult) {
        console.error('🚨 WELCOME EMAIL DELIVERY FAILED - Account Details:');
        console.error(`📧 Recipient: ${email}`);
        console.error(`🔑 Temporary Password: ${tempPassword}`);
        console.error(`👤 User: ${userName || 'Unknown'}`);
        console.error(`🕐 Generated at: ${new Date().toISOString()}`);
        console.error('⚠️  IMPORTANT: Credentials logged due to email delivery failure.');
        console.error('⚠️  In production, ensure email service is properly configured.');
      }

      return emailResult;
    } catch (error) {
      console.error('❌ Error in sendWelcomeEmail method');
      console.error('📧 Welcome email details:', {
        email,
        userName,
        tempPasswordLength: tempPassword?.length || 0, // Don't log the actual password
        timestamp: new Date().toISOString()
      });
      console.error('📧 Error during email rendering/sending:', error);
      console.error('📧 Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('📧 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Also log the temporary password when there's a rendering/sending error
      console.error('🚨 EXCEPTION IN WELCOME EMAIL - Account Details:');
      console.error(`🔑 Temporary Password: ${tempPassword}`);
      console.error(`📧 For: ${email}`);
      
      return false;
    }
  }

  /**
   * Test email service configuration and log details
   */
  static logEmailConfiguration(): void {
    console.log('📧 Email Service Configuration:');
    console.log('📧 RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('📧 RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Using default: onboarding@resend.dev');
    console.log('📧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Using default: http://localhost:3000');
    console.log('📧 Current environment:', process.env.NODE_ENV || 'development');
    console.log('📧 Timestamp:', new Date().toISOString());
  }

  /**
   * Send a test email to verify the service is working
   */
  static async sendTestEmail(to: string): Promise<boolean> {
    console.log('📧 Sending test email...');
    this.logEmailConfiguration();
    
    const result = await this.sendEmail({
      to,
      subject: 'GOAT Mastermind - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: oklch(0.45 0.15 65);">🐐 Test Email from GOAT Mastermind</h2>
          <p>This is a test email to verify that the email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0;">If you received this email, the GOAT Mastermind email service is configured correctly! 🎉</p>
          </div>
        </div>
      `,
      text: `
GOAT Mastermind - Test Email

This is a test email to verify that the email service is working correctly.

Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}

If you received this email, the GOAT Mastermind email service is configured correctly! 🎉
      `
    });

    if (result) {
      console.log('📧 Test email sent successfully!');
    } else {
      console.error('📧 Test email failed to send.');
    }

    return result;
  }
}
