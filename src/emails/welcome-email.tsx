import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName?: string;
  email: string;
  tempPassword: string;
}

export const WelcomeEmail = ({
  userName,
  email,
  tempPassword,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Welcome to GOAT Mastermind! Your account has been created successfully.
    </Preview>
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
          <Text style={headerSubtitle}>Welcome to the ultimate productivity platform</Text>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={heading}>🎉 Welcome to GOAT Mastermind!</Heading>
          
          <Text style={greeting}>
            Hello{userName ? ` ${userName}` : ''},
          </Text>

          <Text style={paragraph}>
            Congratulations! Your GOAT Mastermind account has been created successfully. 
            You now have access to our powerful platform designed to help you achieve your goals and maximize productivity.
          </Text>

          {/* Credentials Box */}
          <Section style={credentialsBox}>
            <Text style={credentialsTitle}>🔑 Your Login Credentials</Text>
            
            <Section style={credentialItem}>
              <Text style={credentialLabel}>Email Address:</Text>
              <Text style={credentialValue}>{email}</Text>
            </Section>
            
            <Section style={credentialItem}>
              <Text style={credentialLabel}>Temporary Password:</Text>
              <Section style={passwordContainer}>
                <Text style={passwordText}>{tempPassword}</Text>
              </Section>
            </Section>
          </Section>

          {/* Security Notice */}
          <Section style={securityBox}>
            <Text style={securityTitle}>🔒 Important Security Information</Text>
            <ul style={list}>
              <li style={listItem}>This is a <strong>temporary password</strong> for your first login</li>
              <li style={listItem}>You'll be prompted to create a new password on your first sign-in</li>
              <li style={listItem}>Choose a strong password with at least 8 characters</li>
              <li style={listItem}>Keep your login credentials secure and never share them</li>
            </ul>
          </Section>

          {/* Action Button */}
          <Section style={buttonContainer}>
            <Button
              style={primaryButton}
              href={`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`}
            >
              Sign In to Your Account
            </Button>
          </Section>

          {/* Features Preview */}
          <Section style={featuresSection}>
            <Text style={featuresTitle}>🚀 What you can do with GOAT Mastermind:</Text>
            <Row>
              <Column style={featureColumn}>
                <Text style={featureIcon}>📈</Text>
                <Text style={featureText}>Advanced Analytics</Text>
              </Column>
              <Column style={featureColumn}>
                <Text style={featureIcon}>🤖</Text>
                <Text style={featureText}>AI-Powered Insights</Text>
              </Column>
              <Column style={featureColumn}>
                <Text style={featureIcon}>⚡</Text>
                <Text style={featureText}>Lightning Fast Performance</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Need help getting started? Check out our{' '}
            <Link style={link} href="#documentation">
              documentation
            </Link>{' '}
            or contact our support team at{' '}
            <Link style={link} href="mailto:support@goatmastermind.com">
              support@goatmastermind.com
            </Link>
          </Text>

          <Text style={signature}>
            Welcome aboard!<br />
            The GOAT Mastermind Team
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            This email was sent from GOAT Mastermind account system.
          </Text>
          <Text style={footerText}>
            You're receiving this because an account was created for you.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px',
  color: '#ffffff',
  textAlign: 'center' as const,
};

const logoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const logoSubtext = {
  fontSize: '20px',
  color: '#e8e5ff',
  margin: '0',
  fontWeight: '300',
};

const headerSubtitle = {
  fontSize: '16px',
  color: '#c5b9ff',
  margin: '16px 0 0 0',
  fontStyle: 'italic',
};

const content = {
  padding: '40px',
};

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#2d3748',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const greeting = {
  fontSize: '18px',
  color: '#4a5568',
  margin: '0 0 16px 0',
  fontWeight: '500',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a5568',
  margin: '0 0 24px 0',
};

const credentialsBox = {
  backgroundColor: '#f7fafc',
  border: '2px solid #667eea',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const credentialsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#667eea',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const credentialItem = {
  margin: '0 0 16px 0',
};

const credentialLabel = {
  fontSize: '14px',
  color: '#718096',
  margin: '0 0 4px 0',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const credentialValue = {
  fontSize: '16px',
  color: '#2d3748',
  fontWeight: '500',
  margin: '0',
};

const passwordContainer = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '4px 0 0 0',
  textAlign: 'center' as const,
};

const passwordText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
  letterSpacing: '2px',
  margin: '0',
};

const securityBox = {
  backgroundColor: '#e6fffa',
  border: '1px solid #81e6d9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const securityTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#234e52',
  margin: '0 0 12px 0',
};

const list = {
  margin: '0',
  padding: '0 0 0 16px',
  color: '#234e52',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.2s ease',
};

const featuresSection = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
};

const featuresTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2d3748',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const featureColumn = {
  textAlign: 'center' as const,
  padding: '0 8px',
};

const featureIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const featureText = {
  fontSize: '14px',
  color: '#4a5568',
  fontWeight: '500',
  margin: '0',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#718096',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
};

const signature = {
  fontSize: '16px',
  color: '#4a5568',
  lineHeight: '1.5',
  margin: '0 0 32px 0',
  fontWeight: '500',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};

const footerSection = {
  backgroundColor: '#f7fafc',
  padding: '24px 40px',
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  fontSize: '12px',
  color: '#a0aec0',
  textAlign: 'center' as const,
  margin: '0 0 4px 0',
};

export default WelcomeEmail;
