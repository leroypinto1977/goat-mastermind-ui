"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/ui/code-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoatLogo } from "@/components/goat-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Shield, Loader2, Clock, Mail } from "lucide-react";
import { toast } from "sonner";

function VerifyResetCodeForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length !== 6) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Invalid code");
        return;
      }

      toast.success("Code verified successfully!");
      router.push(
        `/auth/reset-password?email=${encodeURIComponent(email)}&token=${data.verificationToken}`
      );
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Verify code error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || resendCount >= 2) return;

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to resend code");
        return;
      }

      toast.success("New code sent to your email!");
      setResendCount((prev) => prev + 1);
      setCode(""); // Clear the input
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Resend code error:", error);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          {/* <Shield className="h-8 w-8 text-primary" /> */}
          <CardTitle className="text-2xl font-bold">
            Verify Reset Code
          </CardTitle>
          <CardDescription className="text-base">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <label className="text-sm font-medium block">
                Enter Verification Code
              </label>
              <p className="text-xs text-muted-foreground">
                We sent a 6-digit code to your email
              </p>
            </div>

            <div className="flex justify-center">
              <CodeInput
                length={6}
                value={code}
                onChange={setCode}
                disabled={loading}
                className="gap-2"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Code expires in 10 minutes</span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <div className="h-px bg-border flex-1" />
                <span className="px-3 text-xs text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={resendLoading || resendCount >= 2}
                className="text-sm hover:bg-primary/10 transition-colors duration-200"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending new code...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Code {resendCount > 0 && `(${2 - resendCount} left)`}
                  </>
                )}
              </Button>

              {resendCount >= 2 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Maximum resend attempts reached
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Please try again later or contact support
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors duration-200 gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Email Entry
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyResetCode() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-small-black/[0.2] bg-grid-small-white/[0.2] dark:bg-grid-small-white/[0.2]" />
      <div className="absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="absolute top-6 left-6 z-10">
        <GoatLogo size="lg" />
      </div>
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Suspense
          fallback={
            <Card className="w-full border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-xl">Loading...</CardTitle>
              </CardHeader>
            </Card>
          }
        >
          <VerifyResetCodeForm />
        </Suspense>
      </div>
    </div>
  );
}
