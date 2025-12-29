import { env } from "@my-better-t-app/env/server";
import mysql from "mysql2/promise";

/**
 * Database connection pool singleton
 * This provides a shared connection pool for all database operations
 */
class Database {
  private static instance: mysql.Pool | null = null;

  /**
   * Get the database connection pool instance
   */
  static getPool(): mysql.Pool {
    if (!Database.instance) {
      Database.instance = mysql.createPool({
        host: env.DB_HOST,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        timezone: "Z",
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    }
    return Database.instance;
  }

  /**
   * Close the database connection pool
   */
  static async close(): Promise<void> {
    if (Database.instance) {
      await Database.instance.end();
      Database.instance = null;
    }
  }

  /**
   * Test the database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const pool = Database.getPool();
      await pool.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }
}

export const db = Database.getPool();
export default Database;
