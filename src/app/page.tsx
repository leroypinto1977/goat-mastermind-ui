"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordResetModal } from "@/components/password-reset-modal";
import { Settings, LogOut, User } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetChecked, setPasswordResetChecked] = useState(false);

  // Check if user needs to reset password
  useEffect(() => {
    if (session?.user && !passwordResetChecked) {
      if (session.user.requiresPasswordReset) {
        setShowPasswordReset(true);
      }
      setPasswordResetChecked(true);
    }
  }, [session, passwordResetChecked]);

  const handlePasswordResetClose = (success?: boolean) => {
    setShowPasswordReset(false);
    if (success) {
      // Refresh session to update user status
      window.location.reload();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const agents = [
    {
      title: "Scripting Agent",
      description: "Generate and edit scripts with AI assistance",
      active: true,
    },
    {
      title: "Video Agent",
      description: "Create and edit video content using AI",
      active: true,
    },
    {
      title: "Background Music",
      description: "Generate custom background music for your videos",
      active: false,
    },
    {
      title: "Image Generation",
      description: "Create stunning visuals with AI",
      active: false,
    },
    {
      title: "Title Generation",
      description: "Generate engaging titles for your content",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">GOAT Mastermind</h1>
            <p className="text-muted-foreground mt-2">
              {session
                ? `Welcome back, ${session.user?.name || session.user?.email}!`
                : "Welcome to the AI Agent Hub"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {session && session.user?.role === "ADMIN" && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/admin")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            )}

            {session ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/auth/signin")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* Authentication Status Card */}
        {session && (
          <div className="mb-8">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Email:</strong> {session.user?.email}
                </div>
                <div>
                  <strong>Role:</strong> {session.user?.role}
                </div>
                <div className="text-sm text-green-600">
                  ✅ Successfully authenticated with NextAuth.js v5
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Getting Started Card */}
        <div className="mb-8">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Getting Started with GOAT Mastermind
              </CardTitle>
              <CardDescription className="text-base">
                Explore our comprehensive suite of AI agents designed to
                revolutionize your content creation workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">
                    Available Now
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <h4 className="font-medium">Scripting Agent</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate professional scripts with AI assistance.
                          Perfect for videos, presentations, and content
                          creation.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <h4 className="font-medium">Video Agent</h4>
                        <p className="text-sm text-muted-foreground">
                          Create and edit video content seamlessly with
                          intelligent AI-powered tools and automation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-orange-500">
                    Coming Soon
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2"></div>
                      <div>
                        <h4 className="font-medium">
                          Background Music Generator
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Generate custom soundtracks and background music
                          tailored to your content's mood and style.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2"></div>
                      <div>
                        <h4 className="font-medium">Image Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Create stunning visuals, thumbnails, and graphics with
                          state-of-the-art AI image generation.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2"></div>
                      <div>
                        <h4 className="font-medium">Title Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate engaging, SEO-optimized titles and headlines
                          that capture attention and drive engagement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  💡 <strong>Pro Tip:</strong> Start with the Scripting Agent to
                  create compelling narratives, then expand your workflow with
                  additional agents as they become available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        {session ? (
          <div className="flex flex-wrap justify-center gap-4">
            {agents.map((agent, index) => (
              <div
                key={index}
                className={`relative w-56 h-40 ${
                  !agent.active ? "opacity-60" : ""
                }`}
              >
                {agent.title === "Scripting Agent" && agent.active ? (
                  <Link href="/scripting-agent" className="block h-full">
                    <Card className="h-full w-full transition-all hover:shadow-lg hover:scale-105">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">
                          {agent.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {agent.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ) : (
                  <Card
                    className={`h-full w-full transition-all relative ${
                      !agent.active
                        ? "blur-[1px]"
                        : "hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{agent.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2"></CardContent>
                    {!agent.active && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to access the AI agents and start creating
                  content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => (window.location.href = "/auth/signin")}
                  className="w-full"
                >
                  Sign In to Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Password Reset Modal */}
        <PasswordResetModal
          isOpen={showPasswordReset}
          onClose={handlePasswordResetClose}
          userEmail={session?.user?.email}
        />
      </div>
    </div>
  );
}
