import { UserStatus } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { prisma } from "./prisma";
import crypto from "crypto";
import { EmailService } from "./email-service";

export interface CreateUserInput {
  email: string;
  name?: string;
  role?: "USER" | "ADMIN";
  createdById?: string;
}

export interface LoginResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresPasswordReset?: boolean;
}

export class AuthService {
  // Generate a secure temporary password
  static generateTemporaryPassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return hash(password, 12);
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  // Create user with temporary password
  static async createUser(
    input: CreateUserInput
  ): Promise<{ user: any; tempPassword: string }> {
    const tempPassword = this.generateTemporaryPassword();
    const hashedPassword = await this.hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name || null,
        password: hashedPassword,
        role: input.role || "USER",
        createdBy: input.createdById || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Log the user creation
    if (input.createdById) {
      await this.logActivity(input.createdById, "USER_CREATED", {
        targetUserId: user.id,
        targetUserEmail: user.email,
        role: user.role,
      });
    }

    return { user, tempPassword };
  }

  // Authenticate user
  static async authenticateUser(
    email: string,
    password: string,
    deviceInfo?: any
  ): Promise<LoginResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          devices: {
            where: { isActive: true },
            orderBy: { lastActive: "desc" },
          },
        },
      });

      if (!user || !user.password) {
        return { success: false, error: "Invalid credentials" };
      }

      // Check if user is active
      if (user.status !== "ACTIVE") {
        return { success: false, error: "Account is disabled" };
      }

      // Verify password
      const isValidPassword = await compare(password, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid credentials" };
      }

      // Check if user needs to change password based on isFirstLogin
      const requiresPasswordReset = user.isFirstLogin;

      // SINGLE SESSION ENFORCEMENT: Terminate all existing sessions
      await this.terminateAllUserSessions(user.id);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Create new device session if device info provided
      if (deviceInfo) {
        await this.registerDevice(user.id, deviceInfo);
      }

      // Log successful login
      await this.logActivity(user.id, "USER_LOGIN", {
        method: "credentials",
        sessionEnforcement: "single_session_active",
        requiresPasswordReset: requiresPasswordReset,
      });

      return {
        success: true,
        requiresPasswordReset: requiresPasswordReset,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "Authentication failed" };
    }
  }

  // Terminate all user sessions (for single-session enforcement)
  static async terminateAllUserSessions(userId: string): Promise<void> {
    try {
      // Deactivate all user devices (which effectively kills sessions)
      await prisma.device.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          lastActive: new Date(),
        },
      });

      // Delete any database sessions
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Log the session termination
      await this.logActivity(userId, "SESSIONS_TERMINATED", {
        reason: "Single session enforcement - new login detected",
        automated: true,
      });
    } catch (error) {
      console.error("Error terminating user sessions:", error);
    }
  }

  // Reset password (first login or admin reset)
  static async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const hashedPassword = await this.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          status: "ACTIVE",
        },
      });

      // Log password change
      await this.logActivity(userId, "PASSWORD_CHANGED", {
        reason: "Admin password reset",
      });

      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      return false;
    }
  }

  // Change password for first-time users
  static async changePasswordFromTemp(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        return { success: false, error: "User not found" };
      }

      // Verify current password
      const isValidPassword = await compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Current password is incorrect" };
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password and set isFirstLogin to false
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          isFirstLogin: false,
        },
      });

      // Log the password change
      await this.logActivity(userId, "PASSWORD_CHANGED", {
        reason: "Password changed by user",
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error("Password change error:", error);
      return { success: false, error: "Failed to change password" };
    }
  }

  // Create device fingerprint
  static createDeviceFingerprint(userAgent: string, ipAddress: string): string {
    return crypto
      .createHash("sha256")
      .update(`${userAgent}-${ipAddress}`)
      .digest("hex");
  }

  // Register device for session tracking
  static async registerDevice(
    userId: string,
    deviceInfo: any
  ): Promise<string> {
    const device = await prisma.device.create({
      data: {
        userId,
        deviceName: deviceInfo.deviceName || null,
        deviceType: deviceInfo.deviceType || null,
        browser: deviceInfo.browser || null,
        os: deviceInfo.os || null,
        ipAddress: deviceInfo.ipAddress || null,
        fingerprint:
          deviceInfo.fingerprint ||
          `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    });

    return device.id;
  }

  // Create user by admin
  async createUserByAdmin(data: {
    email: string;
    name: string;
    role: "USER" | "ADMIN";
    createdById?: string;
  }): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    tempPassword?: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(tempPassword, 12);

      // Create user (make createdBy optional for now)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: data.role,
          status: "ACTIVE",
          emailVerified: new Date(),
          // Skip createdBy for now to avoid foreign key issues
          // createdBy: data.createdById
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Log the action (only if createdById is provided)
      if (data.createdById) {
        await prisma.auditLog.create({
          data: {
            userId: data.createdById,
            action: "USER_CREATED",
            details: `Created user ${data.email} with role ${data.role}`,
            ipAddress: null,
            userAgent: "Admin Action",
          },
        });
      }

      // Send welcome email with credentials
      const emailSent = await EmailService.sendWelcomeEmail(
        data.email,
        tempPassword,
        data.name
      );

      if (!emailSent) {
        console.error("Failed to send welcome email to:", data.email);
        // Don't fail user creation if email fails
      }

      return {
        success: true,
        user: { ...user, tempPassword },
        tempPassword,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, error: "Failed to create user" };
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<any[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        sessions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  }

  // Update user status (admin only)
  async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: "USER_STATUS_UPDATED",
          details: `User status changed to ${status}`,
          ipAddress: null,
          userAgent: "Admin Action",
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating user status:", error);
      return { success: false, error: "Failed to update user status" };
    }
  }

  // Revoke all user sessions
  async revokeAllUserSessions(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete all sessions for the user
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Deactivate all user devices
      await prisma.device.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          lastActive: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SESSIONS_TERMINATED",
          details: "All user sessions terminated by admin",
          ipAddress: null,
          userAgent: "Admin Action",
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error revoking user sessions:", error);
      return { success: false, error: "Failed to revoke sessions" };
    }
  }

  // Delete user (admin only)
  async deleteUser(
    userId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user info before deletion for logging
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, role: true },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Prevent admin from deleting themselves
      if (userId === adminId) {
        return { success: false, error: "Cannot delete your own account" };
      }

      // Delete the user (cascade deletes related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log the deletion
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: "USER_DELETED",
          details: `Deleted user: ${user.email} (${
            user.name || "No name"
          }) - Role: ${user.role}`,
          ipAddress: null,
          userAgent: "Admin Action",
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: "Failed to delete user" };
    }
  }

  // Invalidate user sessions
  static async invalidateUserSessions(userId: string): Promise<void> {
    // Deactivate all user devices (which effectively kills sessions)
    await prisma.device.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Also delete any actual sessions
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Log activity
  static async logActivity(
    userId: string | null,
    action: string,
    details?: any,
    request?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: details || null,
          ipAddress: request?.ip || null,
          userAgent: request?.headers?.["user-agent"] || null,
        },
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  // Validate session
  static async validateSession(sessionToken: string): Promise<any> {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    // Update last active
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    return session;
  }
}
