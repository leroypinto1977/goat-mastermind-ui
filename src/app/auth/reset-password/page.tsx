"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoatLogo } from "@/components/goat-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Success Modal Component
function PasswordResetSuccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-card border border-border rounded-lg shadow-xl p-8 w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
            Password Reset Successful!
          </h2>
          <p className="text-muted-foreground">
            Your password has been updated. You will be redirected to the
            sign-in page.
          </p>
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-green-500 h-1 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!email || !token) {
      router.push("/auth/forgot-password");
    }
  }, [email, token, router]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token || !passwordValidation.isValid || !passwordsMatch)
      return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          verificationToken: token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to reset password");
        return;
      }

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = async () => {
    setShowSuccessModal(false);
    // Sign out any existing session and redirect to sign in
    await signOut({ redirect: false });
    router.push(
      "/auth/signin?message=" +
        encodeURIComponent(
          "Password reset successfully! Please sign in with your new password."
        )
    );
  };

  if (!email || !token) {
    return null;
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 justify-center">
            <Lock className="h-6 w-6 text-primary" />
            Reset Password
          </CardTitle>
          <CardDescription>Enter your new password for {email}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {newPassword && (
                <div className="text-xs space-y-1 mt-2">
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${passwordValidation.hasUpperCase ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${passwordValidation.hasLowerCase ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.hasNumbers ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${passwordValidation.hasNumbers ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    One number
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    One special character
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-all duration-200 hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`text-xs flex items-center gap-1 mt-1 ${passwordsMatch ? "text-green-600" : "text-destructive"}`}
                >
                  <CheckCircle
                    className={`h-3 w-3 ${passwordsMatch ? "text-green-600" : "text-destructive"}`}
                  />
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || !passwordValidation.isValid || !passwordsMatch
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PasswordResetSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <GoatLogo size="lg" />
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
