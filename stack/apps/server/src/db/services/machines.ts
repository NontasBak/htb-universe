import { db } from "../connection";
import type {
  Machine,
  MachineWithDetails,
  MachineFilter,
  PaginatedResponse,
  Vulnerability,
  Module,
} from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * Machine Service
 *
 * Handles all database operations related to HTB machines
 */
class MachineService {
  /**
   * Get all machines with optional filtering and pagination
   */
  async getMachines(filter: MachineFilter = {}): Promise<PaginatedResponse<Machine>> {
    const {
      difficulty,
      os,
      vulnerabilities,
      modules,
      search,
      limit = 50,
      offset = 0,
    } = filter;

    try {
      let query = "SELECT * FROM machines WHERE 1=1";
      const params: any[] = [];

      // Apply filters
      if (difficulty) {
        query += " AND difficulty = ?";
        params.push(difficulty);
      }

      if (os) {
        query += " AND os = ?";
        params.push(os);
      }

      if (search) {
        query += " AND (name LIKE ? OR synopsis LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      // Filter by vulnerabilities (machines that have ALL specified vulnerabilities)
      if (vulnerabilities && vulnerabilities.length > 0) {
        const placeholders = vulnerabilities.map(() => "?").join(",");
        query += ` AND id IN (
          SELECT machine_id
          FROM machine_vulnerabilities
          WHERE vulnerability_id IN (${placeholders})
          GROUP BY machine_id
          HAVING COUNT(DISTINCT vulnerability_id) = ?
        )`;
        params.push(...vulnerabilities, vulnerabilities.length);
      }

      // Filter by modules
      if (modules && modules.length > 0) {
        const placeholders = modules.map(() => "?").join(",");
        query += ` AND id IN (
          SELECT machine_id
          FROM machine_modules
          WHERE module_id IN (${placeholders})
        )`;
        params.push(...modules);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await db.query<RowDataPacket[]>(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Add pagination
      query += " ORDER BY id DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      // Execute query
      const [rows] = await db.query<RowDataPacket[]>(query, params);

      return {
        data: rows as Machine[],
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
      };
    } catch (error) {
      console.error("Error getting machines:", error);
      throw new Error("Failed to get machines");
    }
  }

  /**
   * Get machine by ID with all related details
   */
  async getMachineById(id: number): Promise<MachineWithDetails | null> {
    try {
      // Get machine
      const [machineRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM machines WHERE id = ?",
        [id]
      );

      if (machineRows.length === 0) {
        return null;
      }

      const machine = machineRows[0] as Machine;

      // Get vulnerabilities
      const [vulnRows] = await db.query<RowDataPacket[]>(
        `SELECT v.*
         FROM vulnerabilities v
         JOIN machine_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.machine_id = ?`,
        [id]
      );

      // Get modules
      const [moduleRows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM modules m
         JOIN machine_modules mm ON m.id = mm.module_id
         WHERE mm.machine_id = ?`,
        [id]
      );

      // Get languages
      const [langRows] = await db.query<RowDataPacket[]>(
        `SELECT language
         FROM machine_languages
         WHERE machine_id = ?`,
        [id]
      );

      // Get areas of interest
      const [aoiRows] = await db.query<RowDataPacket[]>(
        `SELECT area_of_interest
         FROM machine_areas_of_interest
         WHERE machine_id = ?`,
        [id]
      );

      return {
        ...machine,
        vulnerabilities: vulnRows as Vulnerability[],
        modules: moduleRows as Module[],
        languages: langRows.map(row => row.language),
        areasOfInterest: aoiRows.map(row => row.area_of_interest),
      };
    } catch (error) {
      console.error("Error getting machine by ID:", error);
      return null;
    }
  }

  /**
   * Get machines by vulnerability IDs (INTERSECT logic from query2.sql)
   * Finds machines that contain ALL specified vulnerabilities
   */
  async getMachinesByVulnerabilities(vulnerabilityIds: number[]): Promise<Machine[]> {
    if (vulnerabilityIds.length === 0) {
      return [];
    }

    try {
      const placeholders = vulnerabilityIds.map(() => "?").join(",");

      const query = `
        SELECT m.*
        FROM machines m
        WHERE m.id IN (
          SELECT machine_id
          FROM machine_vulnerabilities
          WHERE vulnerability_id IN (${placeholders})
          GROUP BY machine_id
          HAVING COUNT(DISTINCT vulnerability_id) = ?
        )
        ORDER BY m.difficulty, m.name
      `;

      const [rows] = await db.query<RowDataPacket[]>(
        query,
        [...vulnerabilityIds, vulnerabilityIds.length]
      );

      return rows as Machine[];
    } catch (error) {
      console.error("Error getting machines by vulnerabilities:", error);
      throw new Error("Failed to get machines by vulnerabilities");
    }
  }

  /**
   * Get machines by module ID
   */
  async getMachinesByModule(moduleId: number): Promise<Machine[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM machines m
         JOIN machine_modules mm ON m.id = mm.machine_id
         WHERE mm.module_id = ?
         ORDER BY m.difficulty, m.name`,
        [moduleId]
      );

      return rows as Machine[];
    } catch (error) {
      console.error("Error getting machines by module:", error);
      throw new Error("Failed to get machines by module");
    }
  }

  /**
   * Get popular machines (most user completions)
   */
  async getPopularMachines(limit: number = 10): Promise<Array<{ machine: Machine; completions: number }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*, COUNT(um.user_id) as completions
         FROM machines m
         LEFT JOIN user_machines um ON m.id = um.machine_id
         GROUP BY m.id
         ORDER BY completions DESC, m.rating DESC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => ({
        machine: {
          id: row.id,
          name: row.name,
          synopsis: row.synopsis,
          difficulty: row.difficulty,
          os: row.os,
          url: row.url,
          image: row.image,
        } as Machine,
        completions: row.completions,
      }));
    } catch (error) {
      console.error("Error getting popular machines:", error);
      throw new Error("Failed to get popular machines");
    }
  }

  /**
   * Get recommended machines
   */
  async getRecommendedMachines(limit: number = 10): Promise<Machine[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM machines
         WHERE recommended = 1
         ORDER BY rating DESC, difficulty
         LIMIT ?`,
        [limit]
      );

      return rows as Machine[];
    } catch (error) {
      console.error("Error getting recommended machines:", error);
      throw new Error("Failed to get recommended machines");
    }
  }

  /**
   * Get distinct machine difficulties
   */
  async getDifficulties(): Promise<string[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT DISTINCT difficulty FROM machines WHERE difficulty IS NOT NULL ORDER BY difficulty"
      );

      return rows.map(row => row.difficulty);
    } catch (error) {
      console.error("Error getting difficulties:", error);
      return [];
    }
  }

  /**
   * Get distinct machine operating systems
   */
  async getOperatingSystems(): Promise<string[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT DISTINCT os FROM machines WHERE os IS NOT NULL ORDER BY os"
      );

      return rows.map(row => row.os);
    } catch (error) {
      console.error("Error getting operating systems:", error);
      return [];
    }
  }

  /**
   * Mark machine as completed for a user
   */
  async completeMachine(userId: number, machineId: number, liked?: boolean): Promise<boolean> {
    try {
      const date = Math.floor(Date.now() / 1000); // Unix timestamp

      await db.query(
        `INSERT INTO user_machines (user_id, machine_id, date, likes)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         date = VALUES(date),
         likes = COALESCE(VALUES(likes), likes)`,
        [userId, machineId, date, liked !== undefined ? liked : null]
      );

      return true;
    } catch (error) {
      console.error("Error completing machine:", error);
      return false;
    }
  }

  /**
   * Remove machine completion for a user
   */
  async uncompleteMachine(userId: number, machineId: number): Promise<boolean> {
    try {
      await db.query(
        "DELETE FROM user_machines WHERE user_id = ? AND machine_id = ?",
        [userId, machineId]
      );

      return true;
    } catch (error) {
      console.error("Error uncompleting machine:", error);
      return false;
    }
  }

  /**
   * Get user's completed machines
   */
  async getUserCompletedMachines(userId: number): Promise<Array<{ machine: Machine; date: number; liked: boolean | null }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*, um.date, um.likes
         FROM machines m
         JOIN user_machines um ON m.id = um.machine_id
         WHERE um.user_id = ?
         ORDER BY um.date DESC`,
        [userId]
      );

      return rows.map(row => ({
        machine: {
          id: row.id,
          name: row.name,
          synopsis: row.synopsis,
          difficulty: row.difficulty,
          os: row.os,
          url: row.url,
          image: row.image,
        } as Machine,
        date: row.date,
        liked: row.likes,
      }));
    } catch (error) {
      console.error("Error getting user completed machines:", error);
      return [];
    }
  }

  /**
   * Check if user has completed a machine
   */
  async hasUserCompletedMachine(userId: number, machineId: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT 1 FROM user_machines WHERE user_id = ? AND machine_id = ?",
        [userId, machineId]
      );

      return rows.length > 0;
    } catch (error) {
      console.error("Error checking if user completed machine:", error);
      return false;
    }
  }
}

export const machineService = new MachineService();
export default machineService;
