import { db } from "../connection";
import type { Vulnerability, Machine, Module } from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * Vulnerability Service
 *
 * Handles all database operations related to security vulnerabilities
 */
class VulnerabilityService {
  /**
   * Get all vulnerabilities
   */
  async getVulnerabilities(): Promise<Vulnerability[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM vulnerabilities ORDER BY name"
      );

      return rows as Vulnerability[];
    } catch (error) {
      console.error("Error getting vulnerabilities:", error);
      throw new Error("Failed to get vulnerabilities");
    }
  }

  /**
   * Get vulnerability by ID
   */
  async getVulnerabilityById(id: number): Promise<Vulnerability | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM vulnerabilities WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as Vulnerability;
    } catch (error) {
      console.error("Error getting vulnerability by ID:", error);
      return null;
    }
  }

  /**
   * Get vulnerabilities for a specific machine
   */
  async getVulnerabilitiesByMachine(machineId: number): Promise<Vulnerability[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT v.*
         FROM vulnerabilities v
         JOIN machine_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.machine_id = ?
         ORDER BY v.name`,
        [machineId]
      );

      return rows as Vulnerability[];
    } catch (error) {
      console.error("Error getting vulnerabilities by machine:", error);
      throw new Error("Failed to get vulnerabilities by machine");
    }
  }

  /**
   * Get vulnerabilities for a specific module
   */
  async getVulnerabilitiesByModule(moduleId: number): Promise<Vulnerability[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT v.*
         FROM vulnerabilities v
         JOIN module_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.module_id = ?
         ORDER BY v.name`,
        [moduleId]
      );

      return rows as Vulnerability[];
    } catch (error) {
      console.error("Error getting vulnerabilities by module:", error);
      throw new Error("Failed to get vulnerabilities by module");
    }
  }

  /**
   * Get machines that contain a specific vulnerability
   */
  async getMachinesByVulnerability(vulnerabilityId: number): Promise<Machine[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT m.*
         FROM machines m
         JOIN machine_vulnerabilities mv ON m.id = mv.machine_id
         WHERE mv.vulnerability_id = ?
         ORDER BY m.difficulty, m.name`,
        [vulnerabilityId]
      );

      return rows as Machine[];
    } catch (error) {
      console.error("Error getting machines by vulnerability:", error);
      throw new Error("Failed to get machines by vulnerability");
    }
  }

  /**
   * Get modules that cover a specific vulnerability
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
   * Get vulnerability statistics
   */
  async getVulnerabilityStats(vulnerabilityId: number): Promise<{
    vulnerability: Vulnerability | null;
    machineCount: number;
    moduleCount: number;
    machines: Machine[];
    modules: Module[];
  }> {
    try {
      const vulnerability = await this.getVulnerabilityById(vulnerabilityId);

      if (!vulnerability) {
        return {
          vulnerability: null,
          machineCount: 0,
          moduleCount: 0,
          machines: [],
          modules: [],
        };
      }

      const machines = await this.getMachinesByVulnerability(vulnerabilityId);
      const modules = await this.getModulesByVulnerability(vulnerabilityId);

      return {
        vulnerability,
        machineCount: machines.length,
        moduleCount: modules.length,
        machines,
        modules,
      };
    } catch (error) {
      console.error("Error getting vulnerability stats:", error);
      throw new Error("Failed to get vulnerability stats");
    }
  }

  /**
   * Search vulnerabilities by name
   */
  async searchVulnerabilities(searchTerm: string): Promise<Vulnerability[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM vulnerabilities WHERE name LIKE ? ORDER BY name",
        [`%${searchTerm}%`]
      );

      return rows as Vulnerability[];
    } catch (error) {
      console.error("Error searching vulnerabilities:", error);
      throw new Error("Failed to search vulnerabilities");
    }
  }

  /**
   * Get most common vulnerabilities (by machine count)
   */
  async getMostCommonVulnerabilities(limit: number = 10): Promise<Array<{
    vulnerability: Vulnerability;
    machineCount: number;
    moduleCount: number;
  }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT v.*,
         COUNT(DISTINCT mv.machine_id) as machine_count,
         COUNT(DISTINCT modv.module_id) as module_count
         FROM vulnerabilities v
         LEFT JOIN machine_vulnerabilities mv ON v.id = mv.vulnerability_id
         LEFT JOIN module_vulnerabilities modv ON v.id = modv.vulnerability_id
         GROUP BY v.id
         ORDER BY machine_count DESC, module_count DESC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => ({
        vulnerability: {
          id: row.id,
          name: row.name,
        } as Vulnerability,
        machineCount: row.machine_count,
        moduleCount: row.module_count,
      }));
    } catch (error) {
      console.error("Error getting most common vulnerabilities:", error);
      throw new Error("Failed to get most common vulnerabilities");
    }
  }

  /**
   * Get related vulnerabilities (vulnerabilities that appear together in machines)
   */
  async getRelatedVulnerabilities(vulnerabilityId: number, limit: number = 5): Promise<Array<{
    vulnerability: Vulnerability;
    cooccurrenceCount: number;
  }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT v.*, COUNT(*) as cooccurrence_count
         FROM vulnerabilities v
         JOIN machine_vulnerabilities mv1 ON v.id = mv1.vulnerability_id
         JOIN machine_vulnerabilities mv2 ON mv1.machine_id = mv2.machine_id
         WHERE mv2.vulnerability_id = ? AND v.id != ?
         GROUP BY v.id
         ORDER BY cooccurrence_count DESC
         LIMIT ?`,
        [vulnerabilityId, vulnerabilityId, limit]
      );

      return rows.map(row => ({
        vulnerability: {
          id: row.id,
          name: row.name,
        } as Vulnerability,
        cooccurrenceCount: row.cooccurrence_count,
      }));
    } catch (error) {
      console.error("Error getting related vulnerabilities:", error);
      throw new Error("Failed to get related vulnerabilities");
    }
  }
}

export const vulnerabilityService = new VulnerabilityService();
export default vulnerabilityService;
