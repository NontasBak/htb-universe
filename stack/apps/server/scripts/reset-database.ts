#!/usr/bin/env tsx

/**
 * HTB Universe - Database Initialization & Reset Script
 *
 * This script initializes the database if it doesn't exist, or resets it to a clean state.
 * Clean state = all tables exist but are empty (no data).
 *
 * Usage:
 *   pnpm db:reset
 *
 * Credentials are loaded from .env file in the server directory.
 */

import { createConnection, type Connection } from "mysql2/promise";
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

async function databaseExists(connection: Connection, dbName: string): Promise<boolean> {
  const [rows] = await connection.query<any[]>(
    `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
    [dbName]
  );
  return rows.length > 0;
}

async function createHTBTables(connection: Connection) {
  // Create tables in dependency order (referenced tables first)

  // 1. Exams table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id INT NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      logo VARCHAR(500) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 2. Machines table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS machines (
      id INT NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      synopsis TEXT,
      difficulty ENUM('Easy','Medium','Hard','Insane') DEFAULT NULL,
      os ENUM('Windows','Linux','Android','Solaris','OpenBSD','FreeBSD','Other') DEFAULT NULL,
      url VARCHAR(500) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 3. Modules table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id INT NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      description TEXT,
      difficulty ENUM('Easy','Medium','Hard') DEFAULT NULL,
      url VARCHAR(500) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 4. Vulnerabilities table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id INT NOT NULL,
      name VARCHAR(255) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 5. Users table (legacy)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL,
      username VARCHAR(30) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      role ENUM('User','Admin') DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 6. Units table (depends on modules)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS units (
      id INT NOT NULL,
      module_id INT NOT NULL,
      sequence_order INT DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      type ENUM('Article','Interactive') DEFAULT NULL,
      PRIMARY KEY (id, module_id),
      KEY module_id (module_id),
      CONSTRAINT units_ibfk_1 FOREIGN KEY (module_id) REFERENCES modules (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 7. Machine-related junction tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS machine_areas_of_interest (
      machine_id INT NOT NULL,
      area_of_interest VARCHAR(255) NOT NULL,
      PRIMARY KEY (machine_id, area_of_interest),
      CONSTRAINT machine_areas_of_interest_ibfk_1 FOREIGN KEY (machine_id) REFERENCES machines (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS machine_languages (
      machine_id INT NOT NULL,
      language VARCHAR(255) NOT NULL,
      PRIMARY KEY (machine_id, language),
      CONSTRAINT machine_languages_ibfk_1 FOREIGN KEY (machine_id) REFERENCES machines (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS machine_modules (
      machine_id INT NOT NULL,
      module_id INT NOT NULL,
      PRIMARY KEY (machine_id, module_id),
      KEY module_id (module_id),
      CONSTRAINT machine_modules_ibfk_1 FOREIGN KEY (machine_id) REFERENCES machines (id),
      CONSTRAINT machine_modules_ibfk_2 FOREIGN KEY (module_id) REFERENCES modules (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS machine_vulnerabilities (
      machine_id INT NOT NULL,
      vulnerability_id INT NOT NULL,
      PRIMARY KEY (machine_id, vulnerability_id),
      KEY vulnerability_id (vulnerability_id),
      CONSTRAINT machine_vulnerabilities_ibfk_1 FOREIGN KEY (machine_id) REFERENCES machines (id),
      CONSTRAINT machine_vulnerabilities_ibfk_2 FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 8. Module-related junction tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS module_exams (
      module_id INT NOT NULL,
      exam_id INT NOT NULL,
      PRIMARY KEY (module_id, exam_id),
      KEY exam_id (exam_id),
      CONSTRAINT module_exams_ibfk_1 FOREIGN KEY (module_id) REFERENCES modules (id),
      CONSTRAINT module_exams_ibfk_2 FOREIGN KEY (exam_id) REFERENCES exams (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS module_vulnerabilities (
      module_id INT NOT NULL,
      vulnerability_id INT NOT NULL,
      PRIMARY KEY (module_id, vulnerability_id),
      KEY vulnerability_id (vulnerability_id),
      CONSTRAINT module_vulnerabilities_ibfk_1 FOREIGN KEY (module_id) REFERENCES modules (id),
      CONSTRAINT module_vulnerabilities_ibfk_2 FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 9. User progress tracking tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_exams (
      user_id INT NOT NULL,
      exam_id INT NOT NULL,
      date BIGINT DEFAULT NULL,
      PRIMARY KEY (user_id, exam_id),
      KEY exam_id (exam_id),
      CONSTRAINT user_exams_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
      CONSTRAINT user_exams_ibfk_2 FOREIGN KEY (exam_id) REFERENCES exams (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_machines (
      user_id INT NOT NULL,
      machine_id INT NOT NULL,
      date BIGINT DEFAULT NULL,
      likes TINYINT(1) DEFAULT NULL,
      PRIMARY KEY (user_id, machine_id),
      KEY machine_id (machine_id),
      CONSTRAINT user_machines_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
      CONSTRAINT user_machines_ibfk_2 FOREIGN KEY (machine_id) REFERENCES machines (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_modules (
      user_id INT NOT NULL,
      module_id INT NOT NULL,
      date BIGINT DEFAULT NULL,
      PRIMARY KEY (user_id, module_id),
      KEY module_id (module_id),
      CONSTRAINT user_modules_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
      CONSTRAINT user_modules_ibfk_2 FOREIGN KEY (module_id) REFERENCES modules (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // 10. Vulnerability tools table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vulnerability_tools (
      vulnerability_id INT NOT NULL,
      tool VARCHAR(255) NOT NULL,
      PRIMARY KEY (vulnerability_id, tool),
      CONSTRAINT vulnerability_tools_ibfk_1 FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function createBetterAuthTables(connection: Connection) {
  // Better-auth user table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // Better-auth session table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS session (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      expiresAt TIMESTAMP(3) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId VARCHAR(36) NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      INDEX session_userId_idx (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // Better-auth account table
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
      updatedAt TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
      INDEX account_userId_idx (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // Better-auth verification table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS verification (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      value TEXT NOT NULL,
      expiresAt TIMESTAMP(3) NOT NULL,
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      INDEX verification_identifier_idx (identifier)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function createUserSyncTable(connection: Connection) {
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
}

async function truncateAllTables(connection: Connection, dbName: string) {
  // Get all table names
  const [tables] = await connection.query<any[]>(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [dbName]
  );

  if (tables.length === 0) {
    return;
  }

  // Disable foreign key checks
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  // Truncate each table
  for (const row of tables) {
    const tableName = row.TABLE_NAME;
    try {
      await connection.query(`TRUNCATE TABLE \`${tableName}\``);
    } catch (error: any) {
      log(`  Warning: Could not truncate ${tableName}: ${error.message}`, "yellow");
    }
  }

  // Re-enable foreign key checks
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  logSuccess(`Truncated ${tables.length} tables`);
}

async function resetDatabase(config: {
  host: string;
  user: string;
  password: string;
  database: string;
}) {
  let connection: Connection | null = null;

  try {
    log("\n" + "=".repeat(60), "cyan");
    log("HTB Universe - Database Initialize/Reset Script", "cyan");
    log("=".repeat(60), "cyan");
    log("");

    // Connect to MySQL (without specifying database)
    logStep(1, "Connecting to MySQL server...");
    connection = await createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });
    logSuccess("Connected to MySQL server");

    // Check if database exists
    logStep(2, "Checking database status...");
    const dbExists = await databaseExists(connection, config.database);

    if (dbExists) {
      log(`  Database "${config.database}" exists`, "blue");

      // Check if it has data
      await connection.query(`USE \`${config.database}\``);
      const [countResult] = await connection.query<any[]>(
        `SELECT SUM(TABLE_ROWS) as total_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
        [config.database]
      );
      const totalRows = countResult[0]?.total_rows || 0;

      if (totalRows > 0) {
        log(`  Database contains data (${totalRows} rows across all tables)`, "yellow");
        log("", "reset");
        log("⚠️  WARNING: This will DELETE all data in the database!", "yellow");
        log(`Database: ${config.database}`, "yellow");
        log(`Host: ${config.host}`, "yellow");
        log("");

        const confirmed = await askConfirmation("Are you sure you want to reset the database?");
        if (!confirmed) {
          log("\nAborted.", "red");
          process.exit(0);
        }
      } else {
        log(`  Database is empty or tables don't exist`, "blue");
      }
    } else {
      log(`  Database "${config.database}" does not exist`, "blue");
      log(`  Creating database...`, "blue");
      await connection.query(`CREATE DATABASE \`${config.database}\``);
      logSuccess(`Database "${config.database}" created`);
    }

    // Use the database
    await connection.query(`USE \`${config.database}\``);

    // Create all tables
    logStep(3, "Creating/verifying HTB tables...");
    await createHTBTables(connection);
    logSuccess("HTB tables ready");

    logStep(4, "Creating/verifying Better-Auth tables...");
    await createBetterAuthTables(connection);
    logSuccess("Better-Auth tables ready");

    logStep(5, "Creating/verifying user_sync bridge table...");
    await createUserSyncTable(connection);
    logSuccess("User sync bridge table ready");

    // Truncate all tables to ensure clean state
    logStep(6, "Clearing all data (truncating tables)...");
    await truncateAllTables(connection, config.database);

    // Verify final state
    logStep(7, "Verifying database state...");
    const [tables] = await connection.query<any[]>(
      `SELECT TABLE_NAME, TABLE_ROWS
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [config.database]
    );

    const tableCount = tables.length;
    const totalRows = tables.reduce((sum: number, t: any) => sum + (t.TABLE_ROWS || 0), 0);

    logSuccess(`Database has ${tableCount} tables with ${totalRows} total rows`);

    // Show `key tables`
    log("\nKey tables:", "cyan");
    const [keyTables] = await connection.query<any[]>(
      `SELECT TABLE_NAME as 'Table', TABLE_ROWS as 'Rows'
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME IN ('machines', 'modules', 'exams', 'vulnerabilities', 'users', 'user', 'user_sync')
       ORDER BY TABLE_NAME`,
      [config.database]
    );

    if (keyTables.length > 0) {
      console.table(keyTables);
    }

    log("\n" + "=".repeat(60), "green");
    log("Database is ready with clean empty tables!", "green");
    log("=".repeat(60), "green");
    log("");
    log("Next steps:", "cyan");
    log("  1. Run the scraper to populate data (when implemented)", "cyan");
    log("  2. Start the server with: pnpm dev:server", "cyan");
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

resetDatabase(dbConfig);
