'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const testPasswordResetEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset email sent! Check your console for the code.');
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Error sending email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      // Test the welcome email through user creation
      const response = await fetch('/api/test/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          name: 'Test User',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Welcome email sent! Check your console or email.');
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Error sending email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🐐 GOAT Email Templates
          </h1>
          <p className="text-lg text-gray-600">
            Test our beautiful React Email templates
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Password Reset Email Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              🔐 Password Reset Email
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={testPasswordResetEmail}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Password Reset Email'}
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Features:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✨ Beautiful gradient header</li>
                  <li>🔢 Prominently displayed 6-digit code</li>
                  <li>⏰ Clear expiration notice</li>
                  <li>🔒 Security warnings and tips</li>
                  <li>📱 Fully responsive design</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Welcome Email Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              🎉 Welcome Email
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={testWelcomeEmail}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Sending...' : 'Send Welcome Email'}
              </Button>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Features:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>🎨 Professional branding</li>
                  <li>🔑 Secure credential display</li>
                  <li>📋 Clear security instructions</li>
                  <li>🚀 Feature highlights</li>
                  <li>🔗 Direct sign-in link</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Email Configuration Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            ⚙️ Email Configuration
          </h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Current Status:</h4>
              <p className="text-yellow-800">
                {process.env.RESEND_API_KEY ? (
                  <span className="text-green-600">✅ Resend API configured - emails will be sent</span>
                ) : (
                  <span className="text-orange-600">⚠️ No Resend API key - emails will be simulated (logged to console)</span>
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">To Enable Real Emails:</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Sign up at <a href="https://resend.com" className="text-blue-600 underline">resend.com</a></li>
                  <li>Get your API key</li>
                  <li>Add to .env.local:</li>
                </ol>
                <code className="block bg-gray-800 text-green-400 p-2 rounded mt-2 text-xs">
                  RESEND_API_KEY="re_your_key_here"<br/>
                  RESEND_FROM_EMAIL="GOAT &lt;noreply@yourdomain.com&gt;"
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Template Technology:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>🎨 React Email components</li>
                  <li>📱 Responsive design</li>
                  <li>🎯 Client compatibility tested</li>
                  <li>⚡ Fast rendering</li>
                  <li>🔧 Easy customization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
