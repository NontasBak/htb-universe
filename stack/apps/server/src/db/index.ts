/**
 * Database Module
 *
 * Main entry point for database operations in HTB Universe
 * Exports connection, types, and services
 */

// Export database connection
export { db, default as Database } from "./connection";

// Export all types
export * from "./types";

// Export all services
export * from "./services";

// Named exports for convenience
import { db } from "./connection";
import {
  userSyncService,
  machineService,
  moduleService,
  examService,
  vulnerabilityService,
  statisticsService,
} from "./services";

export const services: {
  userSync: typeof userSyncService;
  machines: typeof machineService;
  modules: typeof moduleService;
  exams: typeof examService;
  vulnerabilities: typeof vulnerabilityService;
  statistics: typeof statisticsService;
} = {
  userSync: userSyncService,
  machines: machineService,
  modules: moduleService,
  exams: examService,
  vulnerabilities: vulnerabilityService,
  statistics: statisticsService,
};

const defaultExport: {
  connection: typeof db;
  services: typeof services;
} = {
  connection: db,
  services,
};

export default defaultExport;
