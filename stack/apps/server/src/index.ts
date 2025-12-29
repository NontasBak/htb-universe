import { auth } from "@my-better-t-app/auth";
import { env } from "@my-better-t-app/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { db, services } from "./db";

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

app.get("/api/machines/recommended", async (_req, res) => {
  try {
    const machines = await services.machines.getRecommendedMachines(10);
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/machines/popular", async (_req, res) => {
  try {
    const machines = await services.machines.getPopularMachines(10);
    res.json(machines);
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

// TODO: Add authentication middleware
// For now, these endpoints require userId in the request

app.get("/api/user/:userId/statistics", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await services.statistics.getUserStatistics(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/user/:userId/machines", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const machines = await services.machines.getUserCompletedMachines(userId);
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/api/user/:userId/machines/:machineId/complete", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const machineId = parseInt(req.params.machineId);
    const liked = req.body.liked;

    const success = await services.machines.completeMachine(userId, machineId, liked);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/user/:userId/modules", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const modules = await services.modules.getUserCompletedModules(userId);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/api/user/:userId/modules/:moduleId/complete", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleId = parseInt(req.params.moduleId);

    const success = await services.modules.completeModule(userId, moduleId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/user/:userId/exams", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const exams = await services.exams.getUserCompletedExams(userId);
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/user/:userId/exams/:examId/progress", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const examId = parseInt(req.params.examId);

    const progress = await services.exams.getExamProgress(userId, examId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
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
