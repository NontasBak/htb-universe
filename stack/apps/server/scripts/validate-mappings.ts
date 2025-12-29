#!/usr/bin/env tsx

/**
 * Module-Vulnerability Mappings Validation Script
 *
 * This script validates that all module IDs and vulnerability IDs in the
 * module-vulnerability-mappings.ts file actually exist in the database.
 *
 * Usage:
 *   tsx scripts/validate-mappings.ts
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createPool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { moduleVulnerabilityMappings } from "../src/scraper/module-vulnerability-mappings.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, "../.env") });

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  console.log("\n" + "=".repeat(60));
  log("Module-Vulnerability Mappings Validator", "cyan");
  console.log("=".repeat(60) + "\n");

  // Create database connection
  const pool = createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "123789=-",
    database: process.env.DB_NAME || "htb_universe",
  });

  try {
    // Fetch all module IDs from database
    log("Fetching modules from database...", "yellow");
    const [moduleRows] = await pool.query<RowDataPacket[]>("SELECT id, name FROM modules");
    const dbModules = new Map(moduleRows.map((row) => [row.id as number, row.name as string]));
    log(`✓ Found ${dbModules.size} modules in database`, "green");

    // Fetch all vulnerability IDs from database
    log("\nFetching vulnerabilities from database...", "yellow");
    const [vulnRows] = await pool.query<RowDataPacket[]>("SELECT id, name FROM vulnerabilities");
    const dbVulnerabilities = new Map(vulnRows.map((row) => [row.id as number, row.name as string]));
    log(`✓ Found ${dbVulnerabilities.size} vulnerabilities in database`, "green");

    // Validate mappings
    log("\nValidating mappings...", "yellow");
    const errors: string[] = [];
    const warnings: string[] = [];
    const validMappings: number[] = [];

    const allMappedModuleIds = new Set<number>();
    const allMappedVulnIds = new Set<number>();

    for (const mapping of moduleVulnerabilityMappings) {
      allMappedModuleIds.add(mapping.moduleId);

      // Check if module exists
      if (!dbModules.has(mapping.moduleId)) {
        errors.push(`Module ID ${mapping.moduleId} does not exist in database`);
        continue;
      }

      const moduleName = dbModules.get(mapping.moduleId);
      let mappingValid = true;

      // Check each vulnerability
      for (const vulnId of mapping.vulnerabilityIds) {
        allMappedVulnIds.add(vulnId);

        if (!dbVulnerabilities.has(vulnId)) {
          errors.push(
            `Vulnerability ID ${vulnId} does not exist in database (referenced by module ${mapping.moduleId}: ${moduleName})`
          );
          mappingValid = false;
        }
      }

      if (mappingValid) {
        validMappings.push(mapping.moduleId);
      }
    }

    // Print statistics
    console.log("\n" + "=".repeat(60));
    log("Validation Results", "cyan");
    console.log("=".repeat(60));

    log(`\nTotal mappings defined:        ${moduleVulnerabilityMappings.length}`, "cyan");
    log(`Valid mappings:                ${validMappings.length}`, "green");
    log(`Unique modules mapped:         ${allMappedModuleIds.size}`, "cyan");
    log(`Unique vulnerabilities mapped: ${allMappedVulnIds.size}`, "cyan");

    // Calculate total relationships
    let totalRelationships = 0;
    for (const mapping of moduleVulnerabilityMappings) {
      totalRelationships += mapping.vulnerabilityIds.length;
    }
    log(`Total relationships:           ${totalRelationships}`, "cyan");

    // Show coverage
    const moduleCoverage = ((allMappedModuleIds.size / dbModules.size) * 100).toFixed(1);
    const vulnCoverage = ((allMappedVulnIds.size / dbVulnerabilities.size) * 100).toFixed(1);
    log(`\nModule coverage:               ${moduleCoverage}% (${allMappedModuleIds.size}/${dbModules.size})`, "cyan");
    log(`Vulnerability coverage:        ${vulnCoverage}% (${allMappedVulnIds.size}/${dbVulnerabilities.size})`, "cyan");

    // Show errors
    if (errors.length > 0) {
      console.log("\n" + "=".repeat(60));
      log("Errors Found", "red");
      console.log("=".repeat(60));
      errors.forEach((error) => log(`✗ ${error}`, "red"));
    }

    // Show warnings
    if (warnings.length > 0) {
      console.log("\n" + "=".repeat(60));
      log("Warnings", "yellow");
      console.log("=".repeat(60));
      warnings.forEach((warning) => log(`⚠ ${warning}`, "yellow"));
    }

    // Final verdict
    console.log("\n" + "=".repeat(60));
    if (errors.length === 0) {
      log("✓ All mappings are valid!", "green");
      console.log("=".repeat(60) + "\n");
      process.exit(0);
    } else {
      log(`✗ Validation failed with ${errors.length} error(s)`, "red");
      console.log("=".repeat(60) + "\n");
      process.exit(1);
    }
  } catch (error) {
    log("\n✗ Validation script failed:", "red");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
