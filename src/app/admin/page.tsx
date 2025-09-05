"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonPresets } from "@/lib/button-animations";
import { GoatLogo } from "@/components/goat-logo";
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  RefreshCw,
} from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  isFirstLogin?: boolean;
  tempPasswordMessage?: string;
  sessions?: any[];
};

type Device = {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
  fingerprint?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    lastLoginAt?: string | null;
  };
};

type AuditLog = {
  id: string;
  action: string;
  details: string | object | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    email: string;
    name?: string;
  } | null;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "devices" | "audit">(
    "users"
  );
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<
    (User & { tempPasswordMessage?: string; isFirstLogin?: boolean }) | null
  >(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  // For suspend/delete confirmation
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "suspend" | "delete";
    user: User;
  }>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  // Create user form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER" as "USER" | "ADMIN",
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Load data when tab changes
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      loadData();
    }
  }, [activeTab, session]);

  // Load all stats data on mount (one time only)
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      // Initial load of all data for stats (only once on mount)
      loadAllStatsData();
    }
  }, [session]);

  const refreshDevicesOnly = async () => {
    setStatsLoading(true);
    try {
      console.log("🔄 Refreshing devices data for Active Sessions...");

      const devicesResponse = await fetch("/api/admin/devices");
      if (devicesResponse.ok) {
        const deviceData = await devicesResponse.json();
        const newDevices = deviceData.devices || [];
        setDevices(newDevices);

        // Calculate active sessions from the fresh data
        const activeSessionsCount = newDevices.filter(
          (d: any) => d.isActive
        ).length;

        console.log(
          "✅ Updated devices data:",
          newDevices.length,
          "devices,",
          activeSessionsCount,
          "active"
        );

        // Show success toast with correct count
        toast.success(
          `Active sessions refreshed! ${activeSessionsCount} active sessions found.`,
          {
            duration: 3000,
          }
        );
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ Error refreshing devices data:", error);
      toast.error("Failed to refresh active sessions data", {
        duration: 3000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAllStatsData = async () => {
    setStatsLoading(true);
    try {
      console.log("🔄 Loading all stats data for admin dashboard...");

      // Load users data
      try {
        const usersResponse = await fetch("/api/admin/users");
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsers(userData.users || []);
          console.log(
            "✅ Updated users data:",
            userData.users?.length || 0,
            "users"
          );
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }

      // Load devices data
      try {
        const devicesResponse = await fetch("/api/admin/devices");
        if (devicesResponse.ok) {
          const deviceData = await devicesResponse.json();
          setDevices(deviceData.devices || []);
          console.log(
            "✅ Updated devices data:",
            deviceData.devices?.length || 0,
            "devices,",
            deviceData.devices?.filter((d: any) => d.isActive).length || 0,
            "active"
          );
        }
      } catch (error) {
        console.error("Error loading devices:", error);
      }

      // Load audit data
      try {
        const auditResponse = await fetch("/api/admin/audit");
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setAuditLogs(auditData.logs || []);
          console.log(
            "✅ Updated audit data:",
            auditData.logs?.length || 0,
            "logs"
          );
        }
      } catch (error) {
        console.error("Error loading audit:", error);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ Error loading stats data:", error);
      toast.error("Failed to refresh dashboard data", {
        duration: 3000,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      switch (activeTab) {
        case "users":
          await loadUsers();
          break;
        case "devices":
          await loadDevices();
          break;
        case "audit":
          await loadAuditLogs();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users");
        // Fallback to demo data for now
        setUsers([
          {
            id: "1",
            name: "System Administrator",
            email: session?.user?.email || "admin@goat.com",
            role: "ADMIN",
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            sessions: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await fetch("/api/admin/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        // Fallback to demo data
        setDevices([
          {
            id: "1",
            deviceName: "Current Session",
            deviceType: "Desktop",
            browser: "Chrome",
            os: "macOS",
            ipAddress: "127.0.0.1",
            isActive: true,
            lastActive: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            fingerprint: "demo123...",
            user: {
              id: session?.user?.id || "demo-user-id",
              email: session?.user?.email || "admin@goat.com",
              name: session?.user?.name || "Administrator",
              role: session?.user?.role || "ADMIN",
              lastLoginAt: new Date().toISOString(),
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
      setDevices([]);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      } else {
        // Fallback to demo data
        setAuditLogs([
          {
            id: "1",
            action: "USER_LOGIN",
            details: "Admin login successful",
            ipAddress: "127.0.0.1",
            createdAt: new Date().toISOString(),
            user: {
              email: session?.user?.email || "admin@goat.com",
              name: session?.user?.name || "Administrator",
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setAuditLogs([]);
    }
  };

  // Show confirmation modal instead of direct submit
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Called when user confirms creation
  const handleConfirmCreateUser = async () => {
    setCreateUserLoading(true);
    setShowConfirmModal(false);

    // Create a local copy of the new user data before resetting
    const newUserData = { ...newUser };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const userData = await response.json();

      // Reset the form after successful creation
      setNewUser({ name: "", email: "", role: "USER" });
      setShowCreateUser(false);

      // Set the created user info and show success modal
      setCreatedUserInfo({
        email: userData.email,
        tempPassword: userData.tempPassword,
      });

      // Show success modal after a small delay to ensure state updates are processed
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);

      // Refresh the users list in the background
      loadUsers().catch(console.error);
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Confirmation for suspend/delete
  // const handleToggleUserStatus = (userId: string, currentStatus: string) => {
  //   const user = users.find((u) => u.id === userId);
  //   if (!user) return;
  //   setConfirmAction({ type: "suspend", user });
  // };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    if (confirmAction.type === "suspend") {
      // ...existing code for suspend (not implemented here)...
      setActionLoading(false);
      setConfirmAction(null);
      return;
    }
    if (confirmAction.type === "delete") {
      // Prevent admin from deleting themselves
      if (confirmAction.user.email === session?.user?.email) {
        setActionLoading(false);
        setConfirmAction(null);
        alert("You cannot delete your own account!");
        return;
      }
      try {
        const response = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: confirmAction.user.id }),
        });
        if (response.ok) {
          setShowDeleteSuccess(true);
          setConfirmAction(null);
          await loadUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || "Failed to delete user"}`);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleKillSession = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/sessions/terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert("User sessions terminated successfully!");
        await loadUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to terminate sessions"}`);
      }
    } catch (error) {
      console.error("Error terminating sessions:", error);
      alert("Failed to terminate sessions");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Prevent admin from deleting themselves
    if (userEmail === session?.user?.email) {
      alert("You cannot delete your own account!");
      return;
    }

    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to permanently delete this user?\n\nEmail: ${userEmail}\n\nThis action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert("User deleted successfully!");
        await loadUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to delete user"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleTerminateDevice = async (deviceId: string, userEmail: string) => {
    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to terminate this device session?\n\nUser: ${userEmail}\n\nThis will log them out immediately.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/devices?id=${deviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "Device session terminated successfully!");
        await loadDevices(); // Refresh devices list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to terminate device"}`);
      }
    } catch (error) {
      console.error("Error terminating device:", error);
      alert("Failed to terminate device session");
    }
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(null); // Clear first to show loading

    try {
      // Fetch detailed user info including temporary password if available
      const response = await fetch(`/api/admin/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser({
          ...user,
          tempPasswordMessage: userData.tempPasswordMessage,
          isFirstLogin: userData.isFirstLogin,
        });
      } else {
        // Fallback to basic user info
        setSelectedUser({
          ...user,
          isFirstLogin: true, // Assume true if we can't fetch details
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Fallback to basic user info
      setSelectedUser({
        ...user,
        isFirstLogin: true,
      });
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
      case "phone":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <GoatLogo size="lg" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Manage users, monitor sessions, and view system activity
                </p>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={loadAllStatsData}
              disabled={statsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
              />
              {statsLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className={`flex items-center gap-2 ${buttonPresets.secondary}`}
            >
              <LogOut className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <p className="text-sm font-medium">Total Users</p>
                </div>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
            onClick={refreshDevicesOnly}
          >
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity
                    className={`h-8 w-8 text-green-500 ${statsLoading ? "animate-pulse" : ""}`}
                  />
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">Active Sessions</p>
                    <p className="text-xs text-muted-foreground">
                      {statsLoading ? "Refreshing..." : "Click to refresh"}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {devices.filter((d) => d.isActive).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-500" />
                  <p className="text-sm font-medium">Admins</p>
                </div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "ADMIN").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
            <CardContent className="px-4 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <p className="text-sm font-medium">Recent Activity</p>
                </div>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              activeTab === "users"
                ? "bg-background shadow-sm text-foreground hover:shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              activeTab === "devices"
                ? "bg-background shadow-sm text-foreground hover:shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Devices & Sessions
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              activeTab === "audit"
                ? "bg-background shadow-sm text-foreground hover:shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {activeTab === "users" && "User Management"}
                  {activeTab === "devices" && "Device & Session Management"}
                  {activeTab === "audit" && "Audit Logs"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "users" &&
                    "Manage user accounts and permissions"}
                  {activeTab === "devices" &&
                    "Monitor active sessions and devices"}
                  {activeTab === "audit" &&
                    "Track system activities and changes"}
                </CardDescription>
              </div>
              {activeTab === "users" && (
                <Button
                  onClick={() => setShowCreateUser(true)}
                  className={buttonPresets.primary}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Users List */}
                    <div className="lg:col-span-2 space-y-4">
                      {users.length > 0 ? (
                        users.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.name || user.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      user.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      user.status === "ACTIVE"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    }`}
                                  >
                                    {user.status}
                                  </span>
                                  {user.sessions &&
                                    user.sessions.length > 0 && (
                                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                        {user.sessions.length} session
                                        {user.sessions.length !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={buttonPresets.secondary}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ type: "suspend", user });
                                }}
                                disabled={user.email === session.user?.email}
                              >
                                {user.status === "ACTIVE" ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 ${buttonPresets.destructive}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ type: "delete", user });
                                }}
                                disabled={user.email === session.user?.email}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              {/* Suspend/Delete Confirmation Modal */}
                              {confirmAction && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
                                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 border border-border">
                                    {actionLoading ? (
                                      <div className="flex flex-col items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                                        <p className="text-lg font-semibold">
                                          Processing...
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-between mb-2">
                                          <h2 className="text-lg font-semibold">
                                            {confirmAction.type === "suspend"
                                              ? confirmAction.user.status ===
                                                "ACTIVE"
                                                ? "Suspend User"
                                                : "Activate User"
                                              : "Delete User"}
                                          </h2>
                                          <Button
                                            onClick={() =>
                                              setConfirmAction(null)
                                            }
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                          >
                                            <X className="h-5 w-5" />
                                          </Button>
                                        </div>
                                        <p className="mb-4">
                                          {confirmAction.type === "suspend"
                                            ? `Are you sure you want to ${
                                                confirmAction.user.status ===
                                                "ACTIVE"
                                                  ? "suspend"
                                                  : "activate"
                                              } the user "${
                                                confirmAction.user.name ||
                                                confirmAction.user.email
                                              }"?`
                                            : `Are you sure you want to permanently delete the user "${
                                                confirmAction.user.name ||
                                                confirmAction.user.email
                                              }"? This action cannot be undone.`}
                                        </p>
                                        <div className="flex gap-3 justify-end">
                                          <Button
                                            variant="outline"
                                            className={buttonPresets.secondary}
                                            onClick={() =>
                                              setConfirmAction(null)
                                            }
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            variant={
                                              confirmAction.type === "delete"
                                                ? "destructive"
                                                : "default"
                                            }
                                            className={
                                              confirmAction.type === "delete"
                                                ? buttonPresets.destructive
                                                : buttonPresets.primary
                                            }
                                            onClick={handleConfirmAction}
                                            disabled={actionLoading}
                                          >
                                            {actionLoading
                                              ? "Processing..."
                                              : "Yes, Confirm"}
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Delete Success Modal */}
                              {showDeleteSuccess && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
                                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 border border-border">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-2 text-green-600 flex items-center gap-2">
                                      <CheckCircle className="h-6 w-6 text-green-500" />
                                      User deleted successfully!
                                    </h2>
                                    <Button
                                      onClick={() =>
                                        setShowDeleteSuccess(false)
                                      }
                                      className="mt-2 w-full"
                                    >
                                      Close
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {user.sessions && user.sessions.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleKillSession(user.id);
                                  }}
                                >
                                  Kill Sessions
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No users found. Click "Add User" to create your first
                          user.
                        </div>
                      )}
                    </div>

                    {/* User Details Sidebar */}
                    <div className="lg:col-span-1">
                      {selectedUser ? (
                        <Card className="sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              User Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Password Unchanged Banner */}
                            {selectedUser.isFirstLogin && (
                              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                    Password Unchanged
                                  </span>
                                </div>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                  User has not changed their temporary password
                                  yet
                                </p>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Name
                              </label>
                              <p className="font-medium">
                                {selectedUser.name || "Not set"}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Email
                              </label>
                              <p className="font-medium">
                                {selectedUser.email}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Role
                              </label>
                              <p className="font-medium">{selectedUser.role}</p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Status
                              </label>
                              <p className="font-medium">
                                {selectedUser.status}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Created
                              </label>
                              <p className="text-sm">
                                {new Date(
                                  selectedUser.createdAt
                                ).toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Last Login
                              </label>
                              <p className="text-sm">
                                {selectedUser.lastLoginAt
                                  ? new Date(
                                      selectedUser.lastLoginAt
                                    ).toLocaleString()
                                  : "Never"}
                              </p>
                            </div>

                            {/* Temporary Password Display */}
                            {selectedUser.tempPasswordMessage && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Temporary Password Status
                                </label>
                                <div className="p-2 bg-muted rounded border text-sm">
                                  {selectedUser.tempPasswordMessage}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Share this with the user for their first login
                                </p>
                              </div>
                            )}

                            {selectedUser.sessions &&
                              selectedUser.sessions.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Active Sessions
                                  </label>
                                  <p className="text-sm">
                                    {selectedUser.sessions.length}
                                  </p>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="sticky top-6">
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2" />
                            <p>Select a user to view details</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Devices Tab */}
                {activeTab === "devices" && (
                  <div className="space-y-4">
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                device.isActive
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                            />
                            <div className="text-muted-foreground">
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {device.user.name || device.user.email}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    device.user.role === "ADMIN"
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  }`}
                                >
                                  {device.user.role}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {device.deviceName || "Unknown Device"} •{" "}
                                {device.browser} on {device.os}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>IP: {device.ipAddress}</span>
                                <span>
                                  Last active:{" "}
                                  {new Date(device.lastActive).toLocaleString()}
                                </span>
                                {device.fingerprint && (
                                  <span>ID: {device.fingerprint}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                device.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                              }`}
                            >
                              {device.isActive ? "Active" : "Inactive"}
                            </span>
                            {device.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleTerminateDevice(
                                    device.id,
                                    device.user.email
                                  )
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                              >
                                Terminate
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No device sessions found.</p>
                        <p className="text-sm">
                          Device sessions will appear here when users log in.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === "audit" && (
                  <div className="space-y-4">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <div key={log.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {log.action.replace(/_/g, " ")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {log.user
                                  ? log.user.name || log.user.email
                                  : "System"}{" "}
                                • {new Date(log.createdAt).toLocaleString()}
                              </p>
                              {log.details && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {typeof log.details === "string"
                                    ? log.details
                                    : JSON.stringify(log.details)}
                                </p>
                              )}
                              {log.ipAddress && (
                                <p className="text-xs text-muted-foreground">
                                  IP: {log.ipAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No audit logs found.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>Add a new user to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {/* Confirmation Modal */}
                  {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-2">
                          Confirm User Creation
                        </h2>
                        <p className="mb-4">
                          Do you want to create a user for{" "}
                          <span className="font-bold">{newUser.name}</span> (
                          <span className="font-mono">{newUser.email}</span>)?
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={handleConfirmCreateUser}
                            disabled={createUserLoading}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setShowConfirmModal(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as "USER" | "ADMIN",
                        })
                      }
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createUserLoading}
                      className="flex-1"
                    >
                      {createUserLoading ? "Creating..." : "Create User"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateUser(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Modal - Moved outside the create user form */}
        {showSuccessModal && createdUserInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col items-center">
              {/* Success Animation */}
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" /> User Created
                Successfully!
              </h2>
              <div className="mb-2 text-center">
                <div className="text-sm text-muted-foreground">
                  Email Address
                </div>
                <div className="font-mono font-medium text-base">
                  {createdUserInfo.email}
                </div>
              </div>
              <div className="mb-4 text-center">
                <div className="text-sm text-muted-foreground">
                  Temporary Password
                </div>
                <div className="font-mono font-medium text-base">
                  {createdUserInfo.tempPassword}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Share this with the user for their first login
                </div>
              </div>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="mt-2 w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
