"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Plus,
  Shield,
  Users,
  Activity,
  Database,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt?: string;
  createdAt: string;
  sessions: { id: string }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    name: "",
    role: "USER" as "ADMIN" | "USER",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    activeSessions: 0,
  });

  // Redirect if not authenticated or not admin
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

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);

        // Calculate stats
        const totalUsers = data.users?.length || 0;
        const activeUsers =
          data.users?.filter((u: User) => u.status === "ACTIVE").length || 0;
        const adminUsers =
          data.users?.filter((u: User) => u.role === "ADMIN").length || 0;
        const activeSessions =
          data.users?.reduce(
            (acc: number, u: User) => acc + (u.sessions?.length || 0),
            0
          ) || 0;

        setStats({
          totalUsers,
          activeUsers,
          adminUsers,
          activeSessions,
        });
      } else {
        console.error("Failed to fetch users:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createUserForm),
      });

      if (response.ok) {
        const newUser = await response.json();
        alert(
          `User created successfully! Temporary password: ${
            newUser.tempPassword || "Check server logs"
          }`
        );
        setCreateUserForm({ email: "", name: "", role: "USER" });
        setShowCreateForm(false);
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
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
        fetchUsers(); // Refresh the list
        alert(`User status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      alert("Failed to update user status");
    }
  };

  const terminateUserSessions = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/sessions/terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        alert("User sessions terminated successfully");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to terminate sessions:", error);
      alert("Failed to terminate sessions");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage users and system settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administrators
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all system users
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Create User Form */}
            {showCreateForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Create New User</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={createUserForm.email}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              email: e.target.value,
                            })
                          }
                          required
                          placeholder="user@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name
                        </label>
                        <Input
                          type="text"
                          value={createUserForm.name}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              name: e.target.value,
                            })
                          }
                          required
                          placeholder="Full Name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Role
                      </label>
                      <select
                        value={createUserForm.role}
                        onChange={(e) =>
                          setCreateUserForm({
                            ...createUserForm,
                            role: e.target.value as "ADMIN" | "USER",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">Create User</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Last Login</th>
                    <th className="text-left p-2">Sessions</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.name || "N/A"}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {user.sessions?.length || 0}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleUserStatus(user.id, user.status)
                            }
                            disabled={user.email === session?.user?.email} // Can't disable own account
                          >
                            {user.status === "ACTIVE" ? "Disable" : "Enable"}
                          </Button>
                          {(user.sessions?.length || 0) > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => terminateUserSessions(user.id)}
                            >
                              Kill Sessions
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No users found. Create your first user above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
