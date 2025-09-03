"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function DeviceTestPage() {
  const { data: session, status } = useSession();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && autoRefresh) {
      const interval = setInterval(checkDeviceStatus, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [status, autoRefresh]);

  const checkDeviceStatus = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      console.log("🔍 DeviceTest: Checking device status...");

      const response = await fetch("/api/auth/check-session", {
        method: "POST",
      });

      const result = await response.json();
      console.log("🔍 DeviceTest: Result:", result);

      setDeviceInfo({
        ...result,
        userAgent: navigator.userAgent,
        ipAddress: "Hidden for security",
        timestamp: new Date().toLocaleString(),
        responseStatus: response.status,
      });
    } catch (error) {
      console.error("Error checking device status:", error);
      setDeviceInfo({
        error: "Failed to check device status",
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      checkDeviceStatus();
    }
  }, [status]);

  const forceDeviceTracking = async () => {
    setLoading(true);
    try {
      console.log("🔄 DeviceTest: Forcing device tracking...");

      const response = await fetch("/api/auth/track-device", {
        method: "POST",
      });
      const result = await response.json();
      console.log("🔄 DeviceTest: Force tracking result:", result);

      // Check status again after tracking
      setTimeout(checkDeviceStatus, 1000);
    } catch (error) {
      console.error("Error forcing device tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <h1>Device Tracking Test</h1>
        <p>Please log in to test device tracking.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Device Tracking Test</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
          >
            {autoRefresh ? "Stop Auto Refresh" : "Start Auto Refresh"}
          </Button>
          <Button
            onClick={checkDeviceStatus}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button onClick={forceDeviceTracking} disabled={loading}>
            Force Track Device
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User:</strong> {session.user.email} ({session.user.role})
          </div>
          <div>
            <strong>User ID:</strong> {session.user.id}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Device Session Status
            {deviceInfo?.isValid === true && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {deviceInfo?.isValid === false && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceInfo ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Session Valid:</strong>{" "}
                  <span
                    className={
                      deviceInfo.isValid
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {deviceInfo.isValid ? "✅ VALID" : "❌ INVALID"}
                  </span>
                </div>
                <div>
                  <strong>Response Status:</strong> {deviceInfo.responseStatus}
                </div>
              </div>

              <div>
                <strong>Message:</strong> {deviceInfo.message}
              </div>

              {deviceInfo.debug && (
                <div className="bg-gray-100 p-3 rounded">
                  <strong>Debug Info:</strong>
                  <pre className="text-sm mt-2">
                    {JSON.stringify(deviceInfo.debug, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <strong>User Agent:</strong>
                <div className="text-sm bg-gray-100 p-2 rounded mt-1 font-mono break-all">
                  {deviceInfo.userAgent}
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <strong>Last Check:</strong> {deviceInfo.timestamp}
                </div>
                <div>
                  <strong>Auto Refresh:</strong> {autoRefresh ? "ON" : "OFF"}
                </div>
              </div>

              {deviceInfo.error && (
                <div className="bg-red-50 p-3 rounded">
                  <strong>Error:</strong>
                  <span className="text-red-600">{deviceInfo.error}</span>
                </div>
              )}
            </>
          ) : (
            <div>
              {loading
                ? "Checking device status..."
                : "Click 'Refresh Status' to check device status"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🧪 Step-by-Step Testing:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Enable Auto Refresh</strong> - Click the "Start Auto
                Refresh" button above
              </li>
              <li>
                <strong>Verify Status</strong> - Make sure session shows as "✅
                VALID"
              </li>
              <li>
                <strong>Open Second Browser</strong> - Open Chrome incognito or
                different browser
              </li>
              <li>
                <strong>Login in Second Browser</strong> - Go to
                http://localhost:3000 and login with same account
              </li>
              <li>
                <strong>Watch This Page</strong> - This session should become
                "❌ INVALID" within 15 seconds
              </li>
              <li>
                <strong>Expect Automatic Logout</strong> - You should be
                redirected to login page automatically
              </li>
            </ol>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🛠️ Admin Termination Test:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Open Admin Panel</strong> - Go to /admin in another tab
                (keep this tab open)
              </li>
              <li>
                <strong>Go to Devices Tab</strong> - Click on "Devices &
                Sessions"
              </li>
              <li>
                <strong>Find Your Device</strong> - Look for your current
                session
              </li>
              <li>
                <strong>Click Terminate</strong> - Terminate your own session
              </li>
              <li>
                <strong>Watch This Tab</strong> - Should show "❌ INVALID" and
                redirect automatically
              </li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 What to Look For:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Console Logs:</strong> Check browser console for
                detailed session checking logs
              </li>
              <li>
                <strong>Toast Notifications:</strong> Should see "Session
                terminated" toast before redirect
              </li>
              <li>
                <strong>Automatic Redirect:</strong> Should automatically go to
                login page
              </li>
              <li>
                <strong>Real-time Updates:</strong> Status should update within
                5-15 seconds
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
