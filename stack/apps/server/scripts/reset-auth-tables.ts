#!/usr/bin/env tsx

/**
 * HTB Universe - Reset Better-Auth Tables Only
 *
 * This script drops and recreates ONLY the better-auth tables
 * (user, session, account, verification, user_sync).
 * HTB data (machines, modules, exams, custom users) will NOT be affected.
 *
 * Usage:
 *   pnpm db:reset-auth
 *
 * Credentials are loaded from .env file in the server directory.
 */

import { createConnection, type Connection } from "mysql2/promise";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import * as readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from server .env file
config({ path: join(__dirname, "../.env") });

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\nStep ${step}: ${message}`, "yellow");
}

function logSuccess(message: string) {
  log(`✓ ${message}`, "green");
}

function logError(message: string) {
  log(`✗ ${message}`, "red");
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (yes/no): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

async function getLatestMigrationFile(): Promise<string | null> {
  const migrationsDir = join(__dirname, "../better-auth_migrations");

  try {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => ({
        name: f,
        path: join(migrationsDir, f),
        time: statSync(join(migrationsDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    return files.length > 0 ? files[0]!.path : null;
  } catch (error) {
    return null;
  }
}

async function resetAuthTables(config: {
  host: string;
  user: string;
  password: string;
  database: string;
}) {
  let connection: Connection | null = null;

  try {
    log("\n" + "=".repeat(50), "cyan");
    log("HTB Universe - Reset Better-Auth Tables", "cyan");
    log("=".repeat(50), "cyan");
    log("");

    // Step 0: Confirm action
    log("⚠️  WARNING: This will DELETE all authentication data!", "yellow");
    log("\nThe following tables will be dropped:", "yellow");
    log("  - user (better-auth users)", "yellow");
    log("  - session (active sessions)", "yellow");
    log("  - account (auth providers)", "yellow");
    log("  - verification (verification tokens)", "yellow");
    log("  - user_sync (bridge table)", "yellow");
    log("\nNote: HTB data (machines, modules, exams, custom users) will NOT be affected.", "green");
    log("");

    const confirmed = await askConfirmation("Are you sure you want to continue?");
    if (!confirmed) {
      log("\nAborted.", "red");
      process.exit(0);
    }

    // Connect to MySQL
    logStep(1, "Connecting to MySQL server...");
    connection = await createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    logSuccess("Connected to MySQL server");

    // Drop better-auth tables
    logStep(2, "Dropping better-auth tables...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    const tablesToDrop = ["user_sync", "verification", "session", "account", "user"];
    for (const table of tablesToDrop) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
        log(`  Dropped: ${table}`, "blue");
      } catch (error: any) {
        log(`  Warning: Could not drop ${table}: ${error.message}`, "yellow");
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    logSuccess("Better-auth tables dropped");

    // Create better-auth tables
    logStep(3, "Creating better-auth tables...");
    const migrationFile = await getLatestMigrationFile();

    if (!migrationFile) {
      log("  No migration file found. Creating tables manually...", "yellow");

      await connection.query(`
        CREATE TABLE IF NOT EXISTS user (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
          image TEXT,
          createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
          updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS session (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          expiresAt TIMESTAMP(3) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
          updatedAt TIMESTAMP(3) NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          userId VARCHAR(36) NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
          INDEX session_userId_idx (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS account (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          accountId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          userId VARCHAR(36) NOT NULL,
          accessToken TEXT,
          refreshToken TEXT,
          idToken TEXT,
          accessTokenExpiresAt TIMESTAMP(3),
          refreshTokenExpiresAt TIMESTAMP(3),
          scope TEXT,
          password TEXT,
          createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
          updatedAt TIMESTAMP(3) NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
          INDEX account_userId_idx (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS verification (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          identifier VARCHAR(255) NOT NULL,
          value TEXT NOT NULL,
          expiresAt TIMESTAMP(3) NOT NULL,
          createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
          updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
          INDEX verification_identifier_idx (identifier)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      logSuccess("Better-auth tables created");
    } else {
      const migrationContent = readFileSync(migrationFile, "utf-8");
      const migrationStatements = migrationContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of migrationStatements) {
        await connection.query(statement);
      }
      logSuccess("Better-auth tables created from migration file");
    }

    // Create user_sync bridge table
    logStep(4, "Creating user_sync bridge table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_sync (
        auth_user_id VARCHAR(36) NOT NULL PRIMARY KEY,
        custom_user_id INT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (auth_user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (custom_user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_custom_user_id (custom_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    logSuccess("User sync bridge table created");

    // Verify tables
    logStep(5, "Verifying tables...");
    log("\nBetter-auth tables:", "cyan");
    const [authTables] = await connection.query<any[]>(
      `SELECT table_name, table_rows
       FROM information_schema.tables
       WHERE table_schema = ?
       AND table_name IN ('user', 'session', 'account', 'verification', 'user_sync')
       ORDER BY table_name`,
      [config.database]
    );

    console.table(authTables);

    log("\n" + "=".repeat(50), "green");
    log("Better-auth tables reset successfully!", "green");
    log("=".repeat(50), "green");
    log("");
    log("You can now start the server with:", "cyan");
    log("  pnpm dev:server", "cyan");
    log("");

  } catch (error: any) {
    logError(`Failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Validate environment variables
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`${colors.red}Error: Missing required environment variables:${colors.reset}`);
  missingEnvVars.forEach((varName) => {
    console.error(`  - ${varName}`);
  });
  console.error("\nMake sure your .env file is configured correctly.");
  process.exit(1);
}

// Main execution
const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

resetAuthTables(dbConfig);
