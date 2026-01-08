import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { ScrollArea } from "../components/ui/scroll-area";
import Loader from "../components/loader";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Shield,
  User,
  Trash2,
  Edit,
  Plus,
  Server,
  BookOpen,
  Bug,
  Award,
  BarChart3,
  Users,
  X,
} from "lucide-react";
import { MachineDialog, ModuleDialog, ExamDialog, VulnerabilityDialog } from "../components/admin";

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);

      if (user.role !== "Admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      // Fetch platform stats
      const platformStats = await api.admin.getPlatformStats();
      setStats(platformStats);
      setLoading(false);
    } catch (error) {
      console.error("Admin access check failed:", error);
      toast.error("Please sign in as an administrator");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users and platform content
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.adminCount} admins, {stats.userCount} users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machines</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMachines}</div>
              <p className="text-xs text-muted-foreground">Lab machines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modules</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules}</div>
              <p className="text-xs text-muted-foreground">Learning modules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exams</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground">Certifications</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement currentUserId={currentUser?.id} />
        </TabsContent>

        <TabsContent value="machines">
          <MachineManagement />
        </TabsContent>

        <TabsContent value="modules">
          <ModuleManagement />
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <VulnerabilityManagement />
        </TabsContent>

        <TabsContent value="exams">
          <ExamManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

function UserManagement({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers({ limit: 100, offset: 0 });
      setUsers(response.users);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: "User" | "Admin") => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
      setShowRoleDialog(false);
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await api.admin.deleteUser(userId);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  const handleCreateUser = async (userData: any) => {
    try {
      // Create via better-auth signup, then promote to admin if needed
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api"}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      // Wait a bit for sync to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // If admin role, promote the user
      if (userData.role === "Admin") {
        const usersResponse = await api.admin.getUsers({ limit: 1000 });
        const newUser = usersResponse.users.find((u: any) => u.email === userData.email);
        if (newUser) {
          await api.admin.updateUserRole(newUser.custom_user_id, "Admin");
        }
      }

      toast.success(`User created successfully${userData.role === "Admin" ? " and promoted to Admin" : ""}`);
      loadUsers();
      setShowCreateDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.custom_user_id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{user.username}</p>
                  <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.totalMachines} machines · {user.totalModules} modules · {user.totalExams} exams
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowRoleDialog(true);
                  }}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Change Role
                </Button>
                {user.custom_user_id !== currentUserId && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.custom_user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Role Change Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update role for {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select
                  defaultValue={selectedUser?.role}
                  onValueChange={(value) => {
                    handleUpdateRole(selectedUser.custom_user_id, value as "User" | "Admin");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateUser}
        />
      </CardContent>
    </Card>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userData: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
    setFormData({ name: "", email: "", password: "", role: "User" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the platform
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value || "User" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MACHINE MANAGEMENT
// ============================================================================

function MachineManagement() {
  const [machines, setMachines] = useState<any[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const response = await api.getMachines({ limit: 1000 });
      const machinesList = response.data || response.machines || response || [];
      setMachines(machinesList);
      setFilteredMachines(machinesList);
    } catch (error) {
      toast.error("Failed to load machines");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMachines(machines);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMachines(
        machines.filter(
          (m) =>
            m.name?.toLowerCase().includes(query) ||
            m.synopsis?.toLowerCase().includes(query) ||
            m.os?.toLowerCase().includes(query) ||
            m.difficulty?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, machines]);

  const handleCreate = () => {
    setEditingMachine(null);
    setShowDialog(true);
  };

  const handleEdit = (machine: any) => {
    setEditingMachine(machine);
    setShowDialog(true);
  };

  const handleDelete = async (machineId: number) => {
    if (!confirm("Are you sure you want to delete this machine?")) {
      return;
    }

    try {
      await api.admin.deleteMachine(machineId);
      toast.success("Machine deleted successfully");
      loadMachines();
    } catch (error) {
      toast.error("Failed to delete machine");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle>Machine Management</CardTitle>
          <CardDescription>Add, edit, or remove lab machines</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Machine
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search machines by name, OS, difficulty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {filteredMachines.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No machines found matching your search." : "No machines yet."}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((machine) => {
            const getDifficultyColor = (difficulty: string) => {
              switch (difficulty?.toLowerCase()) {
                case "easy": return "bg-green-500 hover:bg-green-600";
                case "medium": return "bg-yellow-500 hover:bg-yellow-600";
                case "hard": return "bg-orange-500 hover:bg-orange-600";
                case "insane": return "bg-red-500 hover:bg-red-600";
                default: return "";
              }
            };

            return (
              <Card key={machine.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base break-words">{machine.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(machine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(machine.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getDifficultyColor(machine.difficulty || "")}>{machine.difficulty}</Badge>
                    <Badge variant="outline">{machine.os}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {machine.synopsis}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <MachineDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          machine={editingMachine}
          onSuccess={loadMachines}
        />
      </CardContent>
    </Card>
  );
}

// MachineDialog is now imported from ../components/admin

// ============================================================================
// MODULE MANAGEMENT
// ============================================================================

function ModuleManagement() {
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await api.getModules({ limit: 1000 });
      const modulesList = response.data || response.modules || response || [];
      setModules(modulesList);
      setFilteredModules(modulesList);
    } catch (error) {
      toast.error("Failed to load modules");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredModules(modules);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredModules(
        modules.filter(
          (m) =>
            m.name?.toLowerCase().includes(query) ||
            m.description?.toLowerCase().includes(query) ||
            m.difficulty?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, modules]);

  const handleCreate = () => {
    setEditingModule(null);
    setShowDialog(true);
  };

  const handleEdit = (module: any) => {
    setEditingModule(module);
    setShowDialog(true);
  };

  const handleDelete = async (moduleId: number) => {
    if (!confirm("Are you sure you want to delete this module?")) {
      return;
    }

    try {
      await api.admin.deleteModule(moduleId);
      toast.success("Module deleted successfully");
      loadModules();
    } catch (error) {
      toast.error("Failed to delete module");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle>Module Management</CardTitle>
          <CardDescription>Add, edit, or remove learning modules</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search modules by name, description, difficulty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {filteredModules.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No modules found matching your search." : "No modules yet."}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module) => {
            const getDifficultyColor = (difficulty: string) => {
              switch (difficulty?.toLowerCase()) {
                case "easy": return "bg-green-500 hover:bg-green-600";
                case "medium": return "bg-yellow-500 hover:bg-yellow-600";
                case "hard": return "bg-orange-500 hover:bg-orange-600";
                default: return "";
              }
            };

            return (
              <Card key={module.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base break-words">{module.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(module)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(module.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <Badge className={getDifficultyColor(module.difficulty || "")}>{module.difficulty}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ModuleDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          module={editingModule}
          onSuccess={loadModules}
        />
      </CardContent>
    </Card>
  );
}

// ModuleDialog is now imported from ../components/admin

// ============================================================================
// VULNERABILITY MANAGEMENT
// ============================================================================

function VulnerabilityManagement() {
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVuln, setEditingVuln] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVulnerabilities();
  }, []);

  const loadVulnerabilities = async () => {
    try {
      setLoading(true);
      const response = await api.getVulnerabilities();
      setVulnerabilities(response || []);
      setFilteredVulnerabilities(response || []);
    } catch (error) {
      toast.error("Failed to load vulnerabilities");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVulnerabilities(vulnerabilities);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVulnerabilities(
        vulnerabilities.filter((v) =>
          v.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, vulnerabilities]);

  const handleCreate = () => {
    setEditingVuln(null);
    setShowDialog(true);
  };

  const handleEdit = (vuln: any) => {
    setEditingVuln(vuln);
    setShowDialog(true);
  };

  const handleDelete = async (vulnId: number) => {
    if (!confirm("Are you sure you want to delete this vulnerability?")) {
      return;
    }

    try {
      await api.admin.deleteVulnerability(vulnId);
      toast.success("Vulnerability deleted successfully");
      loadVulnerabilities();
    } catch (error) {
      toast.error("Failed to delete vulnerability");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle>Vulnerability Management</CardTitle>
          <CardDescription>Add, edit, or remove vulnerabilities</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vulnerability
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search vulnerabilities by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {filteredVulnerabilities.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No vulnerabilities found matching your search." : "No vulnerabilities yet."}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVulnerabilities.map((vuln) => (
            <div
              key={vuln.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Bug className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-medium truncate">{vuln.name}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(vuln)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(vuln.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <VulnerabilityDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          vulnerability={editingVuln}
          onSuccess={loadVulnerabilities}
        />
      </CardContent>
    </Card>
  );
}

// VulnerabilityDialog is now imported from ../components/admin

// ============================================================================
// EXAM MANAGEMENT
// ============================================================================

function ExamManagement() {
  const [exams, setExams] = useState<any[]>([]);
  const [filteredExams, setFilteredExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await api.getExams();
      setExams(response || []);
      setFilteredExams(response || []);
    } catch (error) {
      toast.error("Failed to load exams");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExams(exams);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredExams(
        exams.filter((e) =>
          e.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, exams]);

  const handleCreate = () => {
    setEditingExam(null);
    setShowDialog(true);
  };

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setShowDialog(true);
  };

  const handleDelete = async (examId: number) => {
    if (!confirm("Are you sure you want to delete this exam?")) {
      return;
    }

    try {
      await api.admin.deleteExam(examId);
      toast.success("Exam deleted successfully");
      loadExams();
    } catch (error) {
      toast.error("Failed to delete exam");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle>Exam Management</CardTitle>
          <CardDescription>Add, edit, or remove certification exams</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search exams by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {filteredExams.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "No exams found matching your search." : "No exams yet."}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 min-w-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {exam.logo && (
                      <img
                        src={exam.logo}
                        alt={exam.name}
                        className="h-16 w-16 rounded object-contain shrink-0"
                      />
                    )}
                    <CardTitle className="text-lg leading-tight break-words">{exam.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(exam)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <ExamDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          exam={editingExam}
          onSuccess={loadExams}
        />
      </CardContent>
    </Card>
  );
}

// ExamDialog is now imported from ../components/admin
