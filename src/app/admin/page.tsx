"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  LogOut,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    sessions: number;
  };
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
  };
};

type AuditLog = {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    email: string;
  } | null;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'devices' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // Create user form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Demo data
  useEffect(() => {
    loadDemoData();
  }, [activeTab]);

  const loadDemoData = () => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      switch (activeTab) {
        case 'users':
          setUsers([
            {
              id: "1",
              name: "John Doe",
              email: "john@example.com",
              role: "ADMIN",
              status: "ACTIVE",
              createdAt: "2024-01-15T10:00:00Z",
              lastLoginAt: "2024-01-20T14:30:00Z",
              _count: { sessions: 1 }
            },
            {
              id: "2",
              name: "Jane Smith",
              email: "jane@example.com",
              role: "USER",
              status: "ACTIVE",
              createdAt: "2024-01-16T09:00:00Z",
              lastLoginAt: "2024-01-19T16:45:00Z",
              _count: { sessions: 0 }
            },
            {
              id: "3",
              name: "Bob Johnson",
              email: "bob@example.com",
              role: "USER",
              status: "SUSPENDED",
              createdAt: "2024-01-17T11:00:00Z",
              lastLoginAt: null,
              _count: { sessions: 0 }
            }
          ]);
          break;
        case 'devices':
          setDevices([
            {
              id: "1",
              deviceName: "MacBook Pro",
              deviceType: "Desktop",
              browser: "Chrome",
              os: "macOS",
              ipAddress: "192.168.1.100",
              isActive: true,
              lastActive: "2024-01-20T14:30:00Z",
              user: { email: "john@example.com" }
            },
            {
              id: "2",
              deviceName: "iPhone 15",
              deviceType: "Mobile",
              browser: "Safari",
              os: "iOS",
              ipAddress: "192.168.1.101",
              isActive: false,
              lastActive: "2024-01-19T16:45:00Z",
              user: { email: "jane@example.com" }
            }
          ]);
          break;
        case 'audit':
          setAuditLogs([
            {
              id: "1",
              action: "USER_LOGIN",
              details: "Successful login from Chrome browser",
              ipAddress: "192.168.1.100",
              createdAt: "2024-01-20T14:30:00Z",
              user: { email: "john@example.com" }
            },
            {
              id: "2",
              action: "USER_CREATED",
              details: "New user account created",
              ipAddress: "192.168.1.100",
              createdAt: "2024-01-20T10:15:00Z",
              user: { email: "john@example.com" }
            },
            {
              id: "3",
              action: "USER_SUSPENDED",
              details: "User account suspended by admin",
              ipAddress: "192.168.1.100",
              createdAt: "2024-01-19T09:20:00Z",
              user: { email: "john@example.com" }
            }
          ]);
          break;
      }
      setLoading(false);
    }, 500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newUserData: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        _count: { sessions: 0 }
      };
      
      setUsers([newUserData, ...users]);
      setNewUser({ name: "", email: "", password: "", role: "USER" });
      setShowCreateUser(false);
      setCreateUserLoading(false);
      
      alert("User created successfully! (This is a demo)");
    }, 1000);
  };

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    alert(`User status changed to ${newStatus}! (This is a demo)`);
  };

  const handleKillSession = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, _count: { sessions: 0 } } : user
    ));
    alert("User sessions terminated! (This is a demo)");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Demo admin interface - all functionality is simulated
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/signin'}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Sessions</p>
                  <p className="text-2xl font-bold">
                    {devices.filter(d => d.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Admins</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Recent Logins</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => {
                      if (!u.lastLoginAt) return false;
                      const loginDate = new Date(u.lastLoginAt);
                      const now = new Date();
                      return (now.getTime() - loginDate.getTime()) < (24 * 60 * 60 * 1000);
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-background shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'devices' 
                ? 'bg-background shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Devices & Sessions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'audit' 
                ? 'bg-background shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
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
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'devices' && 'Device & Session Management'}
                  {activeTab === 'audit' && 'Audit Logs'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'users' && 'Manage user accounts and permissions (Demo)'}
                  {activeTab === 'devices' && 'Monitor active sessions and devices (Demo)'}
                  {activeTab === 'audit' && 'Track system activities and changes (Demo)'}
                </CardDescription>
              </div>
              {activeTab === 'users' && (
                <Button onClick={() => setShowCreateUser(true)}>
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
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name || user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              }`}>
                                {user.role}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {user.status}
                              </span>
                              {user._count && user._count.sessions > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                  {user._count.sessions} active session{user._count.sessions !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                          >
                            {user.status === 'ACTIVE' ? (
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
                          {user._count && user._count.sessions > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleKillSession(user.id)}
                            >
                              Kill Sessions
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Devices Tab */}
                {activeTab === 'devices' && (
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            device.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">{device.user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {device.deviceName || 'Unknown Device'} • {device.browser} on {device.os}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              IP: {device.ipAddress} • Last active: {new Date(device.lastActive).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            device.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {device.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.user ? log.user.email : 'System'} • {new Date(log.createdAt).toLocaleString()}
                            </p>
                            {log.details && (
                              <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                            )}
                            {log.ipAddress && (
                              <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                <CardDescription>
                  Add a new user to the system (Demo)
                </CardDescription>
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
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "USER" | "ADMIN" })}
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
