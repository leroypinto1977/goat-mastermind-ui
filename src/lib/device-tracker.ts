import { PrismaClient } from "@prisma/client";
import { UAParser } from "ua-parser-js";

const prisma = new PrismaClient();

export interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent: string;
}

export class DeviceTracker {
  static parseUserAgent(
    userAgent: string
  ): Pick<DeviceInfo, "deviceName" | "deviceType" | "browser" | "os"> {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      deviceName: result.device.model || `${result.os.name} Device`,
      deviceType: result.device.type || this.getDeviceType(userAgent),
      browser: `${result.browser.name} ${result.browser.version}`.trim(),
      os: `${result.os.name} ${result.os.version}`.trim(),
    };
  }

  static getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return "mobile";
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    }
    return "desktop";
  }

  static generateFingerprint(deviceInfo: DeviceInfo): string {
    // For same-device detection, we'll primarily use IP address and basic browser info
    // This will treat different Chrome instances on the same device as the same device
    const components = [
      deviceInfo.ipAddress,
      deviceInfo.browser?.split(" ")[0], // Just browser name, not version
      deviceInfo.os?.split(" ")[0], // Just OS name, not version
    ].filter(Boolean);

    return Buffer.from(components.join("|")).toString("base64");
  }

  static generateSessionFingerprint(deviceInfo: DeviceInfo): string {
    // For session-specific tracking, use the full user agent
    // This will differentiate between browser instances
    const components = [deviceInfo.userAgent, deviceInfo.ipAddress].filter(
      Boolean
    );

    return Buffer.from(components.join("|")).toString("base64");
  }

  static async trackDevice(
    userId: string,
    deviceInfo: DeviceInfo
  ): Promise<string> {
    try {
      console.log("📱 Starting device tracking for user:", userId);
      console.log("🔍 Device info:", deviceInfo);

      const fingerprint = this.generateFingerprint(deviceInfo);
      const sessionFingerprint = this.generateSessionFingerprint(deviceInfo);
      const parsedInfo = this.parseUserAgent(deviceInfo.userAgent);

      console.log(
        "🔑 Generated device fingerprint:",
        fingerprint.substring(0, 10) + "..."
      );
      console.log(
        "🔑 Generated session fingerprint:",
        sessionFingerprint.substring(0, 10) + "..."
      );
      console.log("📋 Parsed device info:", parsedInfo);

      // First, enforce single session rule - deactivate all existing devices for this user
      // This will enforce the "only one active session" rule
      const deactivatedDevices = await prisma.device.updateMany({
        where: {
          userId: userId,
          isActive: true,
        },
        data: {
          isActive: false,
          lastActive: new Date(),
        },
      });

      console.log(
        `🔒 Deactivated ${deactivatedDevices.count} existing devices for user ${userId}`
      );

      // Create or update the current device using session-specific fingerprint
      // This ensures each browser instance gets its own record but only one can be active
      const device = await prisma.device.upsert({
        where: { fingerprint: sessionFingerprint },
        update: {
          isActive: true,
          lastActive: new Date(),
          ipAddress: deviceInfo.ipAddress,
          ...parsedInfo,
        },
        create: {
          userId,
          fingerprint: sessionFingerprint,
          isActive: true,
          lastActive: new Date(),
          ipAddress: deviceInfo.ipAddress,
          ...parsedInfo,
        },
      });

      console.log("✅ Device tracked successfully:", device.id);

      // Log the device login with information about terminated sessions
      await prisma.auditLog.create({
        data: {
          userId,
          action: "DEVICE_LOGIN",
          details: {
            deviceId: device.id,
            deviceInfo: parsedInfo,
            ipAddress: deviceInfo.ipAddress,
            previousSessionsTerminated: deactivatedDevices.count > 0,
            terminatedCount: deactivatedDevices.count,
            fingerprint: sessionFingerprint.substring(0, 10) + "...",
          },
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
        },
      });

      console.log(
        `🎯 Device tracking completed. Active device: ${device.id}, Terminated: ${deactivatedDevices.count}`
      );
      return device.id;
    } catch (error) {
      console.error("❌ Error tracking device:", error);
      throw error;
    }
  }

  static async updateDeviceActivity(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      if (!userAgent) return;

      const sessionFingerprint = this.generateSessionFingerprint({
        userAgent,
        ipAddress,
      } as DeviceInfo);

      await prisma.device.updateMany({
        where: {
          userId,
          fingerprint: sessionFingerprint,
          isActive: true,
        },
        data: {
          lastActive: new Date(),
          ipAddress,
        },
      });
    } catch (error) {
      console.error("Error updating device activity:", error);
    }
  }

  static async terminateDevice(
    deviceId: string,
    reason = "Manual termination"
  ): Promise<boolean> {
    try {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: { user: { select: { id: true, email: true } } },
      });

      if (!device) return false;

      await prisma.device.update({
        where: { id: deviceId },
        data: {
          isActive: false,
          lastActive: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: device.userId,
          action: "DEVICE_TERMINATED",
          details: {
            deviceId,
            reason,
            terminatedAt: new Date(),
          },
          ipAddress: device.ipAddress,
        },
      });

      console.log(
        `Device ${deviceId} terminated for user ${device.user.email}`
      );
      return true;
    } catch (error) {
      console.error("Error terminating device:", error);
      return false;
    }
  }

  static async enforceSessionLimit(
    userId: string,
    maxSessions = 1
  ): Promise<number> {
    try {
      const activeDevices = await prisma.device.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          lastActive: "desc",
        },
      });

      if (activeDevices.length <= maxSessions) {
        return 0; // No sessions terminated
      }

      // Keep the most recent sessions, terminate the rest
      const devicesToTerminate = activeDevices.slice(maxSessions);

      await Promise.all(
        devicesToTerminate.map((device) =>
          this.terminateDevice(device.id, "Session limit exceeded")
        )
      );

      return devicesToTerminate.length;
    } catch (error) {
      console.error("Error enforcing session limit:", error);
      return 0;
    }
  }

  static async getActiveDevicesCount(userId: string): Promise<number> {
    try {
      return await prisma.device.count({
        where: {
          userId,
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Error getting active devices count:", error);
      return 0;
    }
  }
}
