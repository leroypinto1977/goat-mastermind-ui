"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  MoreVertical,
  Settings,
  AlertTriangle,
  TrendingUp,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
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
  user: {
    email: string;
    name?: string;
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

export default function ModernAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState<
    "overview" | "users" | "sessions" | "security"
  >("overview");

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

    // Load all data on mount
    loadAllData();
  }, [session, status, router]);

  const loadAllData = async () => {
    setLoading(true);

    try {
      await Promise.all([loadUsers(), loadDevices(), loadAuditLogs()]);
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
        // Fallback data
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
    }
  };

  const loadDevices = async () => {
    try {
      const response = await fetch("/api/admin/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        // Fallback data
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
            user: {
              email: session?.user?.email || "admin@goat.com",
              name: session?.user?.name || "Administrator",
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      } else {
        // Fallback data
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
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        alert(
          `User created successfully! Temporary password: ${
            userData.tempPassword || "Check email"
          }`
        );
        setNewUser({ name: "", email: "", role: "USER" });
        setShowCreateUser(false);
        await loadUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to create user"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (response.ok) {
        alert(`User status changed to ${newStatus}!`);
        await loadUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to update user"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user status");
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
        await loadAllData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to terminate sessions"}`);
      }
    } catch (error) {
      console.error("Error terminating sessions:", error);
      alert("Failed to terminate sessions");
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

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const totalSessions = devices.filter((d) => d.isActive).length;
  const recentActivity = auditLogs.length;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-muted-foreground">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Modern interface • Single session enforcement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAllData()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <nav className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: "overview", label: "Overview", icon: TrendingUp },
            { key: "users", label: "Users", icon: Users },
            { key: "sessions", label: "Sessions", icon: Activity },
            { key: "security", label: "Security", icon: Shield },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedView(item.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === item.key
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Overview */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Users</p>
                      <p className="text-3xl font-bold">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Active Users</p>
                      <p className="text-3xl font-bold">{activeUsers}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Active Sessions</p>
                      <p className="text-3xl font-bold">{totalSessions}</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Security Events</p>
                      <p className="text-3xl font-bold">{recentActivity}</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user
                            ? log.user.name || log.user.email
                            : "System"}{" "}
                          • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users View */}
        {selectedView === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button
                onClick={() => setShowCreateUser(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.name || user.email}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === "ADMIN"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                }`}
                              >
                                {user.role}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {user.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleUserStatus(user.id, user.status)
                              }
                            >
                              {user.status === "ACTIVE"
                                ? "Suspend User"
                                : "Activate User"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleKillSession(user.id)}
                            >
                              Terminate Sessions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions View */}
        {selectedView === "sessions" && (
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Monitor user sessions and device connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          device.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="text-muted-foreground">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {device.user.name || device.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {device.deviceName || "Unknown Device"} •{" "}
                          {device.browser} on {device.os}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {device.ipAddress} • Last active:{" "}
                          {new Date(device.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        device.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      {device.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security View */}
        {selectedView === "security" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Audit Logs
              </CardTitle>
              <CardDescription>
                Track system activities and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
}
