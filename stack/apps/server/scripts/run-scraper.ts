#!/usr/bin/env tsx

/**
 * HTB Universe - Data Scraper Script
 *
 * This script fetches data from HTB Academy and Labs APIs and populates the MySQL database.
 * It scrapes modules, units, machines, exams, vulnerabilities, and their relationships.
 *
 * Prerequisites:
 *   - Database must be initialized (run pnpm db:reset first)
 *   - HTB_COOKIE and HTB_BEARER must be set in .env
 *
 * Usage:
 *   pnpm scrape
 *
 * Environment variables required:
 *   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (database credentials)
 *   - HTB_COOKIE (HTB Academy session cookie)
 *   - HTB_BEARER (HTB Labs bearer token)
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPool } from "mysql2/promise";
import { HTBScraper } from "../src/scraper/scraper.js";
import type { ScraperConfig } from "../src/scraper/types.js";

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

function logError(message: string) {
  log(`✗ ${message}`, "red");
}

function logSuccess(message: string) {
  log(`✓ ${message}`, "green");
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): boolean {
  const required = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    HTB_COOKIE: process.env.HTB_COOKIE,
    HTB_BEARER: process.env.HTB_BEARER,
  };

  const missing: string[] = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logError("Missing required environment variables:");
    missing.forEach((key) => console.log(`  - ${key}`));
    console.log("\nPlease set these in stack/apps/server/.env");
    return false;
  }

  return true;
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  const pool = createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    await pool.query("SELECT 1");
    logSuccess("Database connection successful");
    await pool.end();
    return true;
  } catch (error) {
    logError("Database connection failed");
    console.error(error instanceof Error ? error.message : error);
    await pool.end();
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  log("HTB Universe Data Scraper", "cyan");
  console.log("=".repeat(60) + "\n");

  // Step 1: Validate environment
  log("Step 1: Validating environment...", "yellow");
  if (!validateEnvironment()) {
    process.exit(1);
  }
  logSuccess("Environment variables validated");

  // Step 2: Test database connection
  log("\nStep 2: Testing database connection...", "yellow");
  if (!(await testDatabaseConnection())) {
    logError("Cannot proceed without database connection");
    process.exit(1);
  }

  // Step 3: Create database connection pool
  log("\nStep 3: Creating database connection pool...", "yellow");
  const pool = createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    timezone: "Z",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  logSuccess("Connection pool created");

  // Step 4: Configure scraper
  log("\nStep 4: Configuring scraper...", "yellow");
  const scraperConfig: ScraperConfig = {
    htbCookie: process.env.HTB_COOKIE!,
    htbBearer: process.env.HTB_BEARER!,
    delayBetweenRequests: 2000, // 2 seconds between requests to avoid rate limiting
    maxModuleId: 500, // Maximum module ID to scrape (adjust as needed)
    populateModuleVulnerabilities: true, // Set to false to skip module-vulnerability mappings
  };
  logSuccess("Scraper configured");

  // Step 5: Run scraper
  log("\nStep 5: Starting scraper...", "yellow");
  const scraper = new HTBScraper(pool, scraperConfig);

  try {
    await scraper.run();
    logSuccess("Scraping completed successfully!");
  } catch (error) {
    logError("Scraping failed!");
    console.error(error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  }

  // Cleanup
  await pool.end();
  logSuccess("Database connection pool closed");

  console.log("\n" + "=".repeat(60));
  log("✅ All operations completed successfully!", "green");
  console.log("=".repeat(60) + "\n");
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  logError("Unhandled rejection:");
  console.error(error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logError("Uncaught exception:");
  console.error(error);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  logError("Fatal error:");
  console.error(error);
  process.exit(1);
});
