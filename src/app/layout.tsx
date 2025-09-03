import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { SessionLimitNotification } from "@/components/session-limit-notification";
import { DeviceTracker } from "@/components/device-tracker";
import { SessionMonitor } from "@/components/session-monitor";
import { SessionEnforcer } from "@/components/session-enforcer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOAT Mastermind - AI Agent Hub",
  description:
    "The Greatest AI Agent Platform - Create, collaborate, and conquer with powerful AI agents",
  manifest: "/manifest.json",
  themeColor: "#b87333",
  icons: {
    icon: [
      { url: "/favicon-16x16.svg", type: "image/svg+xml", sizes: "16x16" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "32x32" },
      { url: "/goat-logo.svg", type: "image/svg+xml", sizes: "64x64" },
    ],
    shortcut: "/favicon.svg",
    apple: "/goat-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <DeviceTracker />
            <SessionMonitor />
            <SessionEnforcer />
            {children}
            <SessionLimitNotification />
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
