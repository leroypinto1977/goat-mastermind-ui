import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  userName?: string;
  resetCode: string;
  validMinutes?: number;
}

export const PasswordResetEmail = ({
  userName,
  resetCode,
  validMinutes = 10,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Your GOAT Mastermind password reset code is {resetCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Row>
            <Column>
              <Text style={logoText}>🐐 GOAT</Text>
            </Column>
            <Column align="right">
              <Text style={logoSubtext}>Mastermind</Text>
            </Column>
          </Row>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={heading}>Password Reset Request</Heading>

          <Text style={greeting}>Hello{userName ? ` ${userName}` : ""},</Text>

          <Text style={paragraph}>
            We received a request to reset your password for your GOAT
            Mastermind account. Use the verification code below to complete the
            process:
          </Text>

          {/* Code Display */}
          <Section style={codeContainer}>
            <Text style={codeLabel}>Verification Code</Text>
            <Text style={codeText}>{resetCode}</Text>
          </Section>

          {/* Instructions */}
          <Section style={instructionsBox}>
            <Text style={instructionsTitle}>⚠️ Important Instructions:</Text>
            <ul style={list}>
              <li style={listItem}>
                This code will expire in <strong>{validMinutes} minutes</strong>
              </li>
              <li style={listItem}>
                You can request up to 2 additional codes if needed
              </li>
              <li style={listItem}>
                If you didn't request this reset, please ignore this email
              </li>
              <li style={listItem}>
                For security, never share this code with anyone
              </li>
            </ul>
          </Section>

          <Text style={paragraph}>
            Simply enter this code in the verification screen to proceed with
            resetting your password.
          </Text>

          {/* Action Button */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-reset-code?email=${encodeURIComponent("")}`}
            >
              Continue Password Reset
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            If you have any questions, please contact our support team at{" "}
            <Link style={link} href="mailto:support@goatmastermind.com">
              support@goatmastermind.com
            </Link>
          </Text>

          <Text style={signature}>
            Best regards,
            <br />
            The GOAT Mastermind Team
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            This email was sent from GOAT Mastermind security system.
          </Text>
          <Text style={footerText}>Please do not reply to this email.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginBottom: "64px",
  borderRadius: "12px",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "32px 40px",
  color: "#ffffff",
};

const logoText = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const logoSubtext = {
  fontSize: "18px",
  color: "#e8e5ff",
  margin: "0",
  fontWeight: "300",
};

const content = {
  padding: "40px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#2d3748",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const greeting = {
  fontSize: "18px",
  color: "#4a5568",
  margin: "0 0 16px 0",
  fontWeight: "500",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4a5568",
  margin: "0 0 20px 0",
};

const codeContainer = {
  backgroundColor: "#f7fafc",
  border: "2px solid #667eea",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "32px 0",
};

const codeLabel = {
  fontSize: "14px",
  color: "#667eea",
  margin: "0 0 8px 0",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const codeText = {
  fontSize: "42px",
  fontWeight: "bold",
  color: "#667eea",
  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
  letterSpacing: "8px",
  margin: "0",
  textShadow: "0 2px 4px rgba(102, 126, 234, 0.1)",
};

const instructionsBox = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const instructionsTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#856404",
  margin: "0 0 12px 0",
};

const list = {
  margin: "0",
  padding: "0 0 0 16px",
  color: "#856404",
};

const listItem = {
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#667eea",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  transition: "all 0.2s ease",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  fontSize: "14px",
  color: "#718096",
  lineHeight: "1.5",
  margin: "0 0 16px 0",
};

const signature = {
  fontSize: "16px",
  color: "#4a5568",
  lineHeight: "1.5",
  margin: "0 0 32px 0",
};

const link = {
  color: "#667eea",
  textDecoration: "underline",
};

const footerSection = {
  backgroundColor: "#f7fafc",
  padding: "24px 40px",
  borderTop: "1px solid #e2e8f0",
};

const footerText = {
  fontSize: "12px",
  color: "#a0aec0",
  textAlign: "center" as const,
  margin: "0 0 4px 0",
};

export default PasswordResetEmail;
