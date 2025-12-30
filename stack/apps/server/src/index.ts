import { auth } from "@my-better-t-app/auth";
import { env } from "@my-better-t-app/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { db, services } from "./db";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "./middleware/auth";
import { initializeAdminUser } from "./services/admin-init";

const app = express();

// Initialize database
async function initializeDatabase() {
  try {
    // Test database connection
    await db.query("SELECT 1");
    console.log("✓ Database connection established");

    // Ensure user_sync table exists
    await services.userSync.ensureSyncTableExists();
    console.log("✓ User sync table initialized");

    // Initialize admin user from environment variables
    await initializeAdminUser();
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    throw error;
  }
}

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());

// ============================================================================
// HEALTH & INFO ENDPOINTS
// ============================================================================

app.get("/", (_req, res) => {
  res.status(200).send("HTB Universe API");
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1 as result");
    const [authTables] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('user', 'session', 'account', 'verification')",
      [env.DB_NAME]
    ) as any[];
    const [customTables] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('users', 'machines', 'modules', 'exams', 'vulnerabilities')",
      [env.DB_NAME]
    ) as any[];
    res.json({
      status: "ok",
      database: "connected",
      authTables: authTables[0].count,
      customTables: customTables[0].count,
      message: "HTB Universe API is running with MySQL database"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============================================================================
// MACHINES ENDPOINTS
// ============================================================================

app.get("/api/machines", async (req, res) => {
  try {
    const filter: any = {
      difficulty: req.query.difficulty as string,
      os: req.query.os as string,
      retired: req.query.retired === "true",
      free: req.query.free === "true",
      search: req.query.search as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    };

    if (req.query.vulnerabilities) {
      filter.vulnerabilities = (req.query.vulnerabilities as string).split(",").map(Number);
    }

    if (req.query.modules) {
      filter.modules = (req.query.modules as string).split(",").map(Number);
    }

    const result = await services.machines.getMachines(filter);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/machines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const machine = await services.machines.getMachineById(id);

    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// MODULES ENDPOINTS
// ============================================================================

app.get("/api/modules", async (req, res) => {
  try {
    const filter: any = {
      difficulty: req.query.difficulty as string,
      tier: req.query.tier ? parseInt(req.query.tier as string) : undefined,
      search: req.query.search as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    };

    if (req.query.vulnerabilities) {
      filter.vulnerabilities = (req.query.vulnerabilities as string).split(",").map(Number);
    }

    if (req.query.exams) {
      filter.exams = (req.query.exams as string).split(",").map(Number);
    }

    const result = await services.modules.getModules(filter);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/modules/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const module = await services.modules.getModuleById(id);

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/modules/:id/units", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const units = await services.modules.getModuleUnits(id);
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// EXAMS ENDPOINTS
// ============================================================================

app.get("/api/exams", async (_req, res) => {
  try {
    const exams = await services.exams.getExams();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/exams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exam = await services.exams.getExamById(id);

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/exams/:id/modules", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const modules = await services.exams.getExamModules(id);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// VULNERABILITIES ENDPOINTS
// ============================================================================

app.get("/api/vulnerabilities", async (_req, res) => {
  try {
    const vulnerabilities = await services.vulnerabilities.getVulnerabilities();
    res.json(vulnerabilities);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/vulnerabilities/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const stats = await services.vulnerabilities.getVulnerabilityStats(id);

    if (!stats.vulnerability) {
      return res.status(404).json({ error: "Vulnerability not found" });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

app.get("/api/statistics/global", async (_req, res) => {
  try {
    const stats = await services.statistics.getGlobalStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// USER-SPECIFIC ENDPOINTS (require authentication)
// ============================================================================

// Get current user info
app.get("/api/user/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    res.json({
      authUserId: req.user.authUserId,
      customUserId: req.user.customUserId,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get current user's statistics
app.get("/api/user/statistics", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return;
    const stats = await services.statistics.getUserStatistics(req.user.customUserId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get current user's completed machines
app.get("/api/user/machines", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return;
    const machines = await services.machines.getUserCompletedMachines(req.user.customUserId);
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Mark machine as completed
app.post("/api/user/machines/:machineId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.machineId) return;
    const machineId = parseInt(req.params.machineId);
    const liked = req.body.liked;

    const success = await services.machines.completeMachine(req.user.customUserId, machineId, liked);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Unmark machine as completed
app.delete("/api/user/machines/:machineId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.machineId) return;
    const machineId = parseInt(req.params.machineId);
    const success = await services.machines.uncompleteMachine(req.user.customUserId, machineId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Check if machine is completed
app.get("/api/user/machines/:machineId/completed", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.machineId) return;
    const machineId = parseInt(req.params.machineId);
    const completed = await services.machines.hasUserCompletedMachine(req.user.customUserId, machineId);
    res.json({ completed });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get current user's completed modules
app.get("/api/user/modules", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return;
    const modules = await services.modules.getUserCompletedModules(req.user.customUserId);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Mark module as completed
app.post("/api/user/modules/:moduleId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.moduleId) return;
    const moduleId = parseInt(req.params.moduleId);
    const success = await services.modules.completeModule(req.user.customUserId, moduleId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Unmark module as completed
app.delete("/api/user/modules/:moduleId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.moduleId) return;
    const moduleId = parseInt(req.params.moduleId);
    const success = await services.modules.uncompleteModule(req.user.customUserId, moduleId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Check if module is completed
app.get("/api/user/modules/:moduleId/completed", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.moduleId) return;
    const moduleId = parseInt(req.params.moduleId);
    const completed = await services.modules.hasUserCompletedModule(req.user.customUserId, moduleId);
    res.json({ completed });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get current user's completed exams
app.get("/api/user/exams", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return;
    const exams = await services.exams.getUserCompletedExams(req.user.customUserId);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Mark exam as completed/certified
app.post("/api/user/exams/:examId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.examId) return;
    const examId = parseInt(req.params.examId);
    const success = await services.exams.completeExam(req.user.customUserId, examId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Unmark exam as completed/certified
app.delete("/api/user/exams/:examId/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.examId) return;
    const examId = parseInt(req.params.examId);
    const success = await services.exams.uncompleteExam(req.user.customUserId, examId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Check if exam is completed
app.get("/api/user/exams/:examId/completed", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.examId) return;
    const examId = parseInt(req.params.examId);
    const completed = await services.exams.hasUserCompletedExam(req.user.customUserId, examId);
    res.json({ completed });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Get exam preparation progress
app.get("/api/user/exams/:examId/progress", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.params.examId) return;
    const examId = parseInt(req.params.examId);
    const progress = await services.exams.getExamProgress(req.user.customUserId, examId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ============================================================================
// ADMIN ENDPOINTS (Protected by requireAdmin middleware)
// ============================================================================

// --- User Management ---
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await services.adminService.getAllUsers(limit, offset);
    const total = await services.adminService.getUserCount();

    res.json({
      users,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id!);
    const user = await services.adminService.getUserDetails(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

app.put("/api/admin/users/:id/role", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id!);
    const { role } = req.body;

    if (!role || (role !== "User" && role !== "Admin")) {
      res.status(400).json({ error: "Invalid role. Must be 'User' or 'Admin'" });
      return;
    }

    const success = await services.adminService.updateUserRole(userId, role);

    if (!success) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id!);
    const adminUserId = req.user!.customUserId;

    const success = await services.adminService.deleteUser(userId, adminUserId);

    if (!success) {
      res.status(400).json({ error: "Cannot delete user" });
      return;
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

// --- Machine Management ---
app.post("/api/admin/machines", requireAdmin, async (req, res) => {
  try {
    const machineId = await services.adminService.createMachine(req.body);
    res.status(201).json({ id: machineId, message: "Machine created successfully" });
  } catch (error) {
    console.error("Error creating machine:", error);
    res.status(500).json({ error: "Failed to create machine" });
  }
});

app.put("/api/admin/machines/:id", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const success = await services.adminService.updateMachine(machineId, req.body);

    if (!success) {
      res.status(404).json({ error: "Machine not found" });
      return;
    }

    res.json({ success: true, message: "Machine updated successfully" });
  } catch (error) {
    console.error("Error updating machine:", error);
    res.status(500).json({ error: "Failed to update machine" });
  }
});

app.delete("/api/admin/machines/:id", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const success = await services.adminService.deleteMachine(machineId);

    if (!success) {
      res.status(404).json({ error: "Machine not found" });
      return;
    }

    res.json({ success: true, message: "Machine deleted successfully" });
  } catch (error) {
    console.error("Error deleting machine:", error);
    res.status(500).json({ error: "Failed to delete machine" });
  }
});

// --- Module Management ---
app.post("/api/admin/modules", requireAdmin, async (req, res) => {
  try {
    const moduleId = await services.adminService.createModule(req.body);
    res.status(201).json({ id: moduleId, message: "Module created successfully" });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Failed to create module" });
  }
});

app.put("/api/admin/modules/:id", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const success = await services.adminService.updateModule(moduleId, req.body);

    if (!success) {
      res.status(404).json({ error: "Module not found" });
      return;
    }

    res.json({ success: true, message: "Module updated successfully" });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Failed to update module" });
  }
});

app.delete("/api/admin/modules/:id", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const success = await services.adminService.deleteModule(moduleId);

    if (!success) {
      res.status(404).json({ error: "Module not found" });
      return;
    }

    res.json({ success: true, message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ error: "Failed to delete module" });
  }
});

// --- Unit Management (for modules) ---
app.post("/api/admin/units", requireAdmin, async (req, res) => {
  try {
    const unitId = await services.adminService.createUnit(req.body);
    res.status(201).json({ id: unitId, message: "Unit created successfully" });
  } catch (error) {
    console.error("Error creating unit:", error);
    res.status(500).json({ error: "Failed to create unit" });
  }
});

app.put("/api/admin/units/:id", requireAdmin, async (req, res) => {
  try {
    const unitId = parseInt(req.params.id!);
    const success = await services.adminService.updateUnit(unitId, req.body);

    if (!success) {
      res.status(404).json({ error: "Unit not found" });
      return;
    }

    res.json({ success: true, message: "Unit updated successfully" });
  } catch (error) {
    console.error("Error updating unit:", error);
    res.status(500).json({ error: "Failed to update unit" });
  }
});

app.delete("/api/admin/units/:id", requireAdmin, async (req, res) => {
  try {
    const unitId = parseInt(req.params.id!);
    const success = await services.adminService.deleteUnit(unitId);

    if (!success) {
      res.status(404).json({ error: "Unit not found" });
      return;
    }

    res.json({ success: true, message: "Unit deleted successfully" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    res.status(500).json({ error: "Failed to delete unit" });
  }
});

// --- Vulnerability Management ---
app.post("/api/admin/vulnerabilities", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Vulnerability name is required" });
      return;
    }

    const vulnId = await services.adminService.createVulnerability(name);
    res.status(201).json({ id: vulnId, message: "Vulnerability created successfully" });
  } catch (error) {
    console.error("Error creating vulnerability:", error);
    res.status(500).json({ error: "Failed to create vulnerability" });
  }
});

app.put("/api/admin/vulnerabilities/:id", requireAdmin, async (req, res) => {
  try {
    const vulnId = parseInt(req.params.id!);
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: "Vulnerability name is required" });
      return;
    }

    const success = await services.adminService.updateVulnerability(vulnId, name);

    if (!success) {
      res.status(404).json({ error: "Vulnerability not found" });
      return;
    }

    res.json({ success: true, message: "Vulnerability updated successfully" });
  } catch (error) {
    console.error("Error updating vulnerability:", error);
    res.status(500).json({ error: "Failed to update vulnerability" });
  }
});

app.delete("/api/admin/vulnerabilities/:id", requireAdmin, async (req, res) => {
  try {
    const vulnId = parseInt(req.params.id!);
    const success = await services.adminService.deleteVulnerability(vulnId);

    if (!success) {
      res.status(404).json({ error: "Vulnerability not found" });
      return;
    }

    res.json({ success: true, message: "Vulnerability deleted successfully" });
  } catch (error) {
    console.error("Error deleting vulnerability:", error);
    res.status(500).json({ error: "Failed to delete vulnerability" });
  }
});

// --- Exam Management ---
app.post("/api/admin/exams", requireAdmin, async (req, res) => {
  try {
    const examId = await services.adminService.createExam(req.body);
    res.status(201).json({ id: examId, message: "Exam created successfully" });
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ error: "Failed to create exam" });
  }
});

app.put("/api/admin/exams/:id", requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(req.params.id!);
    const success = await services.adminService.updateExam(examId, req.body);

    if (!success) {
      res.status(404).json({ error: "Exam not found" });
      return;
    }

    res.json({ success: true, message: "Exam updated successfully" });
  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({ error: "Failed to update exam" });
  }
});

app.delete("/api/admin/exams/:id", requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(req.params.id!);
    const success = await services.adminService.deleteExam(examId);

    if (!success) {
      res.status(404).json({ error: "Exam not found" });
      return;
    }

    res.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ error: "Failed to delete exam" });
  }
});

app.put("/api/admin/exams/:id/modules", requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(req.params.id!);
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      res.status(400).json({ error: "moduleIds must be an array" });
      return;
    }

    const success = await services.adminService.linkModulesToExam(examId, moduleIds);

    if (!success) {
      res.status(500).json({ error: "Failed to link modules to exam" });
      return;
    }

    res.json({ success: true, message: "Modules linked to exam successfully" });
  } catch (error) {
    console.error("Error linking modules to exam:", error);
    res.status(500).json({ error: "Failed to link modules to exam" });
  }
});

// --- Relationship Management ---

// Get all available entities for relationship selection
app.get("/api/admin/entities", requireAdmin, async (_req, res) => {
  try {
    const entities = await services.adminService.getAvailableEntities();
    res.json(entities);
  } catch (error) {
    console.error("Error getting available entities:", error);
    res.status(500).json({ error: "Failed to fetch entities" });
  }
});

// Machine relationships
app.get("/api/admin/machines/:id/relationships", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const relationships = await services.adminService.getMachineRelationships(machineId);
    res.json(relationships);
  } catch (error) {
    console.error("Error getting machine relationships:", error);
    res.status(500).json({ error: "Failed to fetch machine relationships" });
  }
});

app.put("/api/admin/machines/:id/modules", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      res.status(400).json({ error: "moduleIds must be an array" });
      return;
    }

    await services.adminService.updateMachineModules(machineId, moduleIds);
    res.json({ success: true, message: "Machine modules updated successfully" });
  } catch (error) {
    console.error("Error updating machine modules:", error);
    res.status(500).json({ error: "Failed to update machine modules" });
  }
});

app.put("/api/admin/machines/:id/vulnerabilities", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const { vulnerabilityIds } = req.body;

    if (!Array.isArray(vulnerabilityIds)) {
      res.status(400).json({ error: "vulnerabilityIds must be an array" });
      return;
    }

    await services.adminService.updateMachineVulnerabilities(machineId, vulnerabilityIds);
    res.json({ success: true, message: "Machine vulnerabilities updated successfully" });
  } catch (error) {
    console.error("Error updating machine vulnerabilities:", error);
    res.status(500).json({ error: "Failed to update machine vulnerabilities" });
  }
});

app.put("/api/admin/machines/:id/languages", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const { languages } = req.body;

    if (!Array.isArray(languages)) {
      res.status(400).json({ error: "languages must be an array" });
      return;
    }

    await services.adminService.updateMachineLanguages(machineId, languages);
    res.json({ success: true, message: "Machine languages updated successfully" });
  } catch (error) {
    console.error("Error updating machine languages:", error);
    res.status(500).json({ error: "Failed to update machine languages" });
  }
});

app.put("/api/admin/machines/:id/areas", requireAdmin, async (req, res) => {
  try {
    const machineId = parseInt(req.params.id!);
    const { areas } = req.body;

    if (!Array.isArray(areas)) {
      res.status(400).json({ error: "areas must be an array" });
      return;
    }

    await services.adminService.updateMachineAreasOfInterest(machineId, areas);
    res.json({ success: true, message: "Machine areas of interest updated successfully" });
  } catch (error) {
    console.error("Error updating machine areas:", error);
    res.status(500).json({ error: "Failed to update machine areas of interest" });
  }
});

// Module relationships
app.get("/api/admin/modules/:id/relationships", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const relationships = await services.adminService.getModuleRelationships(moduleId);
    res.json(relationships);
  } catch (error) {
    console.error("Error getting module relationships:", error);
    res.status(500).json({ error: "Failed to fetch module relationships" });
  }
});

app.put("/api/admin/modules/:id/machines", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const { machineIds } = req.body;

    if (!Array.isArray(machineIds)) {
      res.status(400).json({ error: "machineIds must be an array" });
      return;
    }

    await services.adminService.updateModuleMachines(moduleId, machineIds);
    res.json({ success: true, message: "Module machines updated successfully" });
  } catch (error) {
    console.error("Error updating module machines:", error);
    res.status(500).json({ error: "Failed to update module machines" });
  }
});

app.put("/api/admin/modules/:id/vulnerabilities", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const { vulnerabilityIds } = req.body;

    if (!Array.isArray(vulnerabilityIds)) {
      res.status(400).json({ error: "vulnerabilityIds must be an array" });
      return;
    }

    await services.adminService.updateModuleVulnerabilities(moduleId, vulnerabilityIds);
    res.json({ success: true, message: "Module vulnerabilities updated successfully" });
  } catch (error) {
    console.error("Error updating module vulnerabilities:", error);
    res.status(500).json({ error: "Failed to update module vulnerabilities" });
  }
});

app.put("/api/admin/modules/:id/exams", requireAdmin, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id!);
    const { examIds } = req.body;

    if (!Array.isArray(examIds)) {
      res.status(400).json({ error: "examIds must be an array" });
      return;
    }

    await services.adminService.updateModuleExams(moduleId, examIds);
    res.json({ success: true, message: "Module exams updated successfully" });
  } catch (error) {
    console.error("Error updating module exams:", error);
    res.status(500).json({ error: "Failed to update module exams" });
  }
});

// Exam relationships
app.get("/api/admin/exams/:id/relationships", requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(req.params.id!);
    const relationships = await services.adminService.getExamRelationships(examId);
    res.json(relationships);
  } catch (error) {
    console.error("Error getting exam relationships:", error);
    res.status(500).json({ error: "Failed to fetch exam relationships" });
  }
});

app.put("/api/admin/exams/:id/modules-new", requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(req.params.id!);
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      res.status(400).json({ error: "moduleIds must be an array" });
      return;
    }

    await services.adminService.updateExamModules(examId, moduleIds);
    res.json({ success: true, message: "Exam modules updated successfully" });
  } catch (error) {
    console.error("Error updating exam modules:", error);
    res.status(500).json({ error: "Failed to update exam modules" });
  }
});

// Vulnerability relationships
app.get("/api/admin/vulnerabilities/:id/relationships", requireAdmin, async (req, res) => {
  try {
    const vulnerabilityId = parseInt(req.params.id!);
    const relationships = await services.adminService.getVulnerabilityRelationships(vulnerabilityId);
    res.json(relationships);
  } catch (error) {
    console.error("Error getting vulnerability relationships:", error);
    res.status(500).json({ error: "Failed to fetch vulnerability relationships" });
  }
});

app.put("/api/admin/vulnerabilities/:id/tools", requireAdmin, async (req, res) => {
  try {
    const vulnerabilityId = parseInt(req.params.id!);
    const { tools } = req.body;

    if (!Array.isArray(tools)) {
      res.status(400).json({ error: "tools must be an array" });
      return;
    }

    await services.adminService.updateVulnerabilityTools(vulnerabilityId, tools);
    res.json({ success: true, message: "Vulnerability tools updated successfully" });
  } catch (error) {
    console.error("Error updating vulnerability tools:", error);
    res.status(500).json({ error: "Failed to update vulnerability tools" });
  }
});

app.put("/api/admin/vulnerabilities/:id/machines", requireAdmin, async (req, res) => {
  try {
    const vulnerabilityId = parseInt(req.params.id!);
    const { machineIds } = req.body;

    if (!Array.isArray(machineIds)) {
      res.status(400).json({ error: "machineIds must be an array" });
      return;
    }

    await services.adminService.updateVulnerabilityMachines(vulnerabilityId, machineIds);
    res.json({ success: true, message: "Vulnerability machines updated successfully" });
  } catch (error) {
    console.error("Error updating vulnerability machines:", error);
    res.status(500).json({ error: "Failed to update vulnerability machines" });
  }
});

app.put("/api/admin/vulnerabilities/:id/modules", requireAdmin, async (req, res) => {
  try {
    const vulnerabilityId = parseInt(req.params.id!);
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      res.status(400).json({ error: "moduleIds must be an array" });
      return;
    }

    await services.adminService.updateVulnerabilityModules(vulnerabilityId, moduleIds);
    res.json({ success: true, message: "Vulnerability modules updated successfully" });
  } catch (error) {
    console.error("Error updating vulnerability modules:", error);
    res.status(500).json({ error: "Failed to update vulnerability modules" });
  }
});

// --- Platform Statistics ---
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const stats = await services.adminService.getPlatformStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting platform stats:", error);
    res.status(500).json({ error: "Failed to fetch platform statistics" });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ============================================================================
// START SERVER
// ============================================================================

initializeDatabase()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
      console.log("API Documentation:");
      console.log("  - Health: GET /api/health");
      console.log("  - Machines: GET /api/machines");
      console.log("  - Modules: GET /api/modules");
      console.log("  - Exams: GET /api/exams");
      console.log("  - Vulnerabilities: GET /api/vulnerabilities");
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
