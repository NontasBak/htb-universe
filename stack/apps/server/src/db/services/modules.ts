import { db } from "../connection";
import type {
  Module,
  ModuleWithDetails,
  ModuleFilter,
  PaginatedResponse,
  Unit,
  Vulnerability,
  Exam,
} from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * Module Service
 *
 * Handles all database operations related to HTB Academy modules
 */
class ModuleService {
  /**
   * Get all modules with optional filtering and pagination
   */
  async getModules(filter: ModuleFilter = {}): Promise<PaginatedResponse<Module>> {
    const {
      difficulty,
      vulnerabilities,
      exams,
      search,
      limit = 50,
      offset = 0,
    } = filter;

    try {
      let query = "SELECT * FROM modules WHERE 1=1";
      const params: any[] = [];

      // Apply filters
      if (difficulty) {
        query += " AND difficulty = ?";
        params.push(difficulty);
      }

      if (search) {
        query += " AND (name LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      // Filter by vulnerabilities
      if (vulnerabilities && vulnerabilities.length > 0) {
        const placeholders = vulnerabilities.map(() => "?").join(",");
        query += ` AND id IN (
          SELECT module_id
          FROM module_vulnerabilities
          WHERE vulnerability_id IN (${placeholders})
        )`;
        params.push(...vulnerabilities);
      }

      // Filter by exams
      if (exams && exams.length > 0) {
        const placeholders = exams.map(() => "?").join(",");
        query += ` AND id IN (
          SELECT module_id
          FROM module_exams
          WHERE exam_id IN (${placeholders})
        )`;
        params.push(...exams);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countRows] = await db.query<RowDataPacket[]>(countQuery, params);
      const total = countRows[0]?.total || 0;

      // Add pagination
      query += " ORDER BY tier, name LIMIT ? OFFSET ?";
      params.push(limit, offset);

      // Execute query
      const [rows] = await db.query<RowDataPacket[]>(query, params);

      return {
        data: rows as Module[],
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
      };
    } catch (error) {
      console.error("Error getting modules:", error);
      throw new Error("Failed to get modules");
    }
  }

  /**
   * Get module by ID with all related details
   */
  async getModuleById(id: number): Promise<ModuleWithDetails | null> {
    try {
      // Get module
      const [moduleRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM modules WHERE id = ?",
        [id]
      );

      if (moduleRows.length === 0) {
        return null;
      }

      const module = moduleRows[0] as Module;

      // Get units ordered by sequence
      const [unitRows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM units
         WHERE module_id = ?
         ORDER BY sequence_order ASC`,
        [id]
      );

      // Get vulnerabilities
      const [vulnRows] = await db.query<RowDataPacket[]>(
        `SELECT v.*
         FROM vulnerabilities v
         JOIN module_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.module_id = ?`,
        [id]
      );

      // Get exams
      const [examRows] = await db.query<RowDataPacket[]>(
        `SELECT e.*
         FROM exams e
         JOIN module_exams me ON e.id = me.exam_id
         WHERE me.module_id = ?`,
        [id]
      );

      return {
        ...module,
        units: unitRows as Unit[],
        vulnerabilities: vulnRows as Vulnerability[],
        exams: examRows as Exam[],
      };
    } catch (error) {
      console.error("Error getting module by ID:", error);
      return null;
    }
  }

  /**
   * Get modules by vulnerability ID
   */
  async getModulesByVulnerability(vulnerabilityId: number): Promise<Module[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM modules m
         JOIN module_vulnerabilities mv ON m.id = mv.module_id
         WHERE mv.vulnerability_id = ?
         ORDER BY m.tier, m.name`,
        [vulnerabilityId]
      );

      return rows as Module[];
    } catch (error) {
      console.error("Error getting modules by vulnerability:", error);
      throw new Error("Failed to get modules by vulnerability");
    }
  }

  /**
   * Get modules by exam ID
   */
  async getModulesByExam(examId: number): Promise<Module[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         ORDER BY m.tier, m.name`,
        [examId]
      );

      return rows as Module[];
    } catch (error) {
      console.error("Error getting modules by exam:", error);
      throw new Error("Failed to get modules by exam");
    }
  }

  /**
   * Get modules for a specific machine
   */
  async getModulesByMachine(machineId: number): Promise<Module[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM modules m
         JOIN machine_modules mm ON m.id = mm.module_id
         WHERE mm.machine_id = ?
         ORDER BY m.tier, m.name`,
        [machineId]
      );

      return rows as Module[];
    } catch (error) {
      console.error("Error getting modules by machine:", error);
      throw new Error("Failed to get modules by machine");
    }
  }

  /**
   * Get popular modules (most user completions)
   */
  async getPopularModules(limit: number = 10): Promise<Array<{ module: Module; completions: number }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*, COUNT(um.user_id) as completions
         FROM modules m
         LEFT JOIN user_modules um ON m.id = um.module_id
         GROUP BY m.id
         ORDER BY completions DESC, m.tier
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => ({
        module: {
          id: row.id,
          name: row.name,
          description: row.description,
          difficulty: row.difficulty,
          url: row.url,
          image: row.image,
        } as Module,
        completions: row.completions,
      }));
    } catch (error) {
      console.error("Error getting popular modules:", error);
      throw new Error("Failed to get popular modules");
    }
  }

  /**
   * Get distinct module difficulties
   */
  async getDifficulties(): Promise<string[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT DISTINCT difficulty FROM modules WHERE difficulty IS NOT NULL ORDER BY difficulty"
      );

      return rows.map(row => row.difficulty);
    } catch (error) {
      console.error("Error getting difficulties:", error);
      return [];
    }
  }

  /**
   * Get distinct module tiers
   */
  async getTiers(): Promise<number[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT DISTINCT tier FROM modules WHERE tier IS NOT NULL ORDER BY tier"
      );

      return rows.map(row => row.tier);
    } catch (error) {
      console.error("Error getting tiers:", error);
      return [];
    }
  }

  /**
   * Mark module as completed for a user
   */
  async completeModule(userId: number, moduleId: number): Promise<boolean> {
    try {
      const date = Math.floor(Date.now() / 1000); // Unix timestamp

      await db.query(
        `INSERT INTO user_modules (user_id, module_id, date)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         date = VALUES(date)`,
        [userId, moduleId, date]
      );

      return true;
    } catch (error) {
      console.error("Error completing module:", error);
      return false;
    }
  }

  /**
   * Remove module completion for a user
   */
  async uncompleteModule(userId: number, moduleId: number): Promise<boolean> {
    try {
      await db.query(
        "DELETE FROM user_modules WHERE user_id = ? AND module_id = ?",
        [userId, moduleId]
      );

      return true;
    } catch (error) {
      console.error("Error uncompleting module:", error);
      return false;
    }
  }

  /**
   * Get user's completed modules
   */
  async getUserCompletedModules(userId: number): Promise<Array<{ module: Module; date: number }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*, um.date
         FROM modules m
         JOIN user_modules um ON m.id = um.module_id
         WHERE um.user_id = ?
         ORDER BY um.date DESC`,
        [userId]
      );

      return rows.map(row => ({
        module: {
          id: row.id,
          name: row.name,
          description: row.description,
          difficulty: row.difficulty,
          url: row.url,
          image: row.image,
        } as Module,
        date: row.date,
      }));
    } catch (error) {
      console.error("Error getting user completed modules:", error);
      return [];
    }
  }

  /**
   * Check if user has completed a module
   */
  async hasUserCompletedModule(userId: number, moduleId: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT 1 FROM user_modules WHERE user_id = ? AND module_id = ?",
        [userId, moduleId]
      );

      return rows.length > 0;
    } catch (error) {
      console.error("Error checking if user completed module:", error);
      return false;
    }
  }

  /**
   * Get incomplete modules for a user based on exam requirements (query5.sql logic)
   */
  async getIncompleteModulesForExam(userId: number, examId: number): Promise<Module[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         AND m.id NOT IN (
           SELECT module_id
           FROM user_modules
           WHERE user_id = ?
         )
         ORDER BY m.tier, m.name`,
        [examId, userId]
      );

      return rows as Module[];
    } catch (error) {
      console.error("Error getting incomplete modules for exam:", error);
      throw new Error("Failed to get incomplete modules for exam");
    }
  }

  /**
   * Get module units by module ID
   */
  async getModuleUnits(moduleId: number): Promise<Unit[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM units
         WHERE module_id = ?
         ORDER BY sequence_order ASC`,
        [moduleId]
      );

      return rows as Unit[];
    } catch (error) {
      console.error("Error getting module units:", error);
      throw new Error("Failed to get module units");
    }
  }

  /**
   * Get unit by ID
   */
  async getUnitById(unitId: number): Promise<Unit | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM units WHERE id = ?",
        [unitId]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as Unit;
    } catch (error) {
      console.error("Error getting unit by ID:", error);
      return null;
    }
  }
}

export const moduleService = new ModuleService();
export default moduleService;
