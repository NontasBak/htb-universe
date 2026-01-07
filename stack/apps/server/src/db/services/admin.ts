import { db } from "../connection";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type {
  MachineDifficulty,
  MachineOS,
  ModuleDifficulty,
  UserSyncWithDetails,
  UnitType,
} from "../types";

/**
 * Admin Service
 *
 * Provides administrative operations for managing users and content.
 * All methods in this service should be protected by requireAdmin middleware.
 */

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export interface AdminUserListItem extends UserSyncWithDetails {
  totalMachines: number;
  totalModules: number;
  totalExams: number;
}

class AdminService {
  /**
   * Get all users with their statistics
   */
  async getAllUsers(limit: number = 50, offset: number = 0): Promise<AdminUserListItem[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
          us.auth_user_id,
          us.custom_user_id,
          us.created_at,
          us.updated_at,
          u.username,
          u.email,
          u.role,
          COUNT(DISTINCT um.machine_id) as totalMachines,
          COUNT(DISTINCT umod.module_id) as totalModules,
          COUNT(DISTINCT ue.exam_id) as totalExams
         FROM user_sync us
         JOIN users u ON us.custom_user_id = u.id
         LEFT JOIN user_machines um ON us.custom_user_id = um.user_id
         LEFT JOIN user_modules umod ON us.custom_user_id = umod.user_id
         LEFT JOIN user_exams ue ON us.custom_user_id = ue.user_id
         GROUP BY us.auth_user_id
         ORDER BY us.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return rows.map((row) => ({
        auth_user_id: row.auth_user_id,
        custom_user_id: row.custom_user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        username: row.username,
        email: row.email,
        role: row.role,
        totalMachines: Number(row.totalMachines || 0),
        totalModules: Number(row.totalModules || 0),
        totalExams: Number(row.totalExams || 0),
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  /**
   * Get total user count
   */
  async getUserCount(): Promise<number> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_sync"
      );
      return rows[0]?.count || 0;
    } catch (error) {
      console.error("Error getting user count:", error);
      return 0;
    }
  }

  /**
   * Update user role (promote/demote)
   */
  async updateUserRole(customUserId: number, role: "User" | "Admin"): Promise<boolean> {
    try {
      // Get auth user ID from custom user ID
      const [syncRows] = await db.query<RowDataPacket[]>(
        "SELECT auth_user_id FROM user_sync WHERE custom_user_id = ?",
        [customUserId]
      );

      if (syncRows.length === 0) {
        return false;
      }

      const authUserId = syncRows[0]!.auth_user_id;

      // Update role in both tables
      await db.query("UPDATE users SET role = ? WHERE id = ?", [role, customUserId]);
      await db.query("UPDATE user_sync SET role = ? WHERE auth_user_id = ?", [
        role,
        authUserId,
      ]);

      return true;
    } catch (error) {
      console.error("Error updating user role:", error);
      return false;
    }
  }

  /**
   * Delete a user (admin only - cannot delete self)
   */
  async deleteUser(customUserId: number, adminCustomUserId: number): Promise<boolean> {
    if (customUserId === adminCustomUserId) {
      throw new Error("Cannot delete your own account");
    }

    try {
      // Delete from users table (CASCADE will handle user_sync and related tables)
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM users WHERE id = ?",
        [customUserId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  /**
   * Get user details by custom user ID
   */
  async getUserDetails(customUserId: number): Promise<AdminUserListItem | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
          us.auth_user_id,
          us.custom_user_id,
          us.created_at,
          us.updated_at,
          u.username,
          u.email,
          u.role,
          COUNT(DISTINCT um.machine_id) as totalMachines,
          COUNT(DISTINCT umod.module_id) as totalModules,
          COUNT(DISTINCT ue.exam_id) as totalExams
         FROM user_sync us
         JOIN users u ON us.custom_user_id = u.id
         LEFT JOIN user_machines um ON us.custom_user_id = um.user_id
         LEFT JOIN user_modules umod ON us.custom_user_id = umod.user_id
         LEFT JOIN user_exams ue ON us.custom_user_id = ue.user_id
         WHERE us.custom_user_id = ?
         GROUP BY us.auth_user_id`,
        [customUserId]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0]!;
      return {
        auth_user_id: row.auth_user_id,
        custom_user_id: row.custom_user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        username: row.username,
        email: row.email,
        role: row.role,
        totalMachines: Number(row.totalMachines || 0),
        totalModules: Number(row.totalModules || 0),
        totalExams: Number(row.totalExams || 0),
      };
    } catch (error) {
      console.error("Error getting user details:", error);
      return null;
    }
  }

  // ============================================================================
  // MACHINE MANAGEMENT
  // ============================================================================

  /**
   * Create a new machine
   */
  async createMachine(machine: {
    name: string;
    synopsis: string;
    difficulty: MachineDifficulty;
    os: MachineOS;
    url?: string;
    image?: string;
    vulnerabilities?: number[];
    languages?: string[];
    areasOfInterest?: string[];
  }): Promise<number> {
    try {
      // Get next available ID
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM machines"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      // Insert machine
      await db.query(
        `INSERT INTO machines (id, name, synopsis, difficulty, os, url, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nextId, machine.name, machine.synopsis, machine.difficulty, machine.os, machine.url || null, machine.image || null]
      );

      // Insert vulnerabilities
      if (machine.vulnerabilities && machine.vulnerabilities.length > 0) {
        const vulnValues = machine.vulnerabilities.map((vulnId) => [nextId, vulnId]);
        await db.query(
          "INSERT INTO machine_vulnerabilities (machine_id, vulnerability_id) VALUES ?",
          [vulnValues]
        );
      }

      // Insert languages
      if (machine.languages && machine.languages.length > 0) {
        const langValues = machine.languages.map((lang) => [nextId, lang]);
        await db.query(
          "INSERT INTO machine_languages (machine_id, language) VALUES ?",
          [langValues]
        );
      }

      // Insert areas of interest
      if (machine.areasOfInterest && machine.areasOfInterest.length > 0) {
        const aoiValues = machine.areasOfInterest.map((aoi) => [nextId, aoi]);
        await db.query(
          "INSERT INTO machine_areas_of_interest (machine_id, area_of_interest) VALUES ?",
          [aoiValues]
        );
      }

      return nextId;
    } catch (error) {
      console.error("Error creating machine:", error);
      throw error;
    }
  }

  /**
   * Update a machine
   */
  async updateMachine(
    id: number,
    machine: {
      name?: string;
      synopsis?: string;
      difficulty?: MachineDifficulty;
      os?: MachineOS;
      url?: string;
      image?: string;
      vulnerabilities?: number[];
      languages?: string[];
      areasOfInterest?: string[];
    }
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (machine.name !== undefined) {
        updates.push("name = ?");
        values.push(machine.name);
      }
      if (machine.synopsis !== undefined) {
        updates.push("synopsis = ?");
        values.push(machine.synopsis);
      }
      if (machine.difficulty !== undefined) {
        updates.push("difficulty = ?");
        values.push(machine.difficulty);
      }
      if (machine.os !== undefined) {
        updates.push("os = ?");
        values.push(machine.os);
      }
      if (machine.url !== undefined) {
        updates.push("url = ?");
        values.push(machine.url);
      }
      if (machine.image !== undefined) {
        updates.push("image = ?");
        values.push(machine.image);
      }

      if (updates.length > 0) {
        values.push(id);
        await db.query(
          `UPDATE machines SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      // Update vulnerabilities
      if (machine.vulnerabilities !== undefined) {
        await db.query("DELETE FROM machine_vulnerabilities WHERE machine_id = ?", [id]);
        if (machine.vulnerabilities.length > 0) {
          const vulnValues = machine.vulnerabilities.map((vulnId) => [id, vulnId]);
          await db.query(
            "INSERT INTO machine_vulnerabilities (machine_id, vulnerability_id) VALUES ?",
            [vulnValues]
          );
        }
      }

      // Update languages
      if (machine.languages !== undefined) {
        await db.query("DELETE FROM machine_languages WHERE machine_id = ?", [id]);
        if (machine.languages.length > 0) {
          const langValues = machine.languages.map((lang) => [id, lang]);
          await db.query(
            "INSERT INTO machine_languages (machine_id, language) VALUES ?",
            [langValues]
          );
        }
      }

      // Update areas of interest
      if (machine.areasOfInterest !== undefined) {
        await db.query("DELETE FROM machine_areas_of_interest WHERE machine_id = ?", [id]);
        if (machine.areasOfInterest.length > 0) {
          const aoiValues = machine.areasOfInterest.map((aoi) => [id, aoi]);
          await db.query(
            "INSERT INTO machine_areas_of_interest (machine_id, area_of_interest) VALUES ?",
            [aoiValues]
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Error updating machine:", error);
      return false;
    }
  }

  /**
   * Delete a machine
   */
  async deleteMachine(id: number): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM machines WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting machine:", error);
      return false;
    }
  }

  // ============================================================================
  // MODULE MANAGEMENT
  // ============================================================================

  /**
   * Create a new module
   */
  async createModule(module: {
    name: string;
    description: string;
    difficulty: ModuleDifficulty;
    url?: string;
    image?: string;
    vulnerabilities?: number[];
  }): Promise<number> {
    try {
      // Get next available ID
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM modules"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      // Insert module
      await db.query(
        `INSERT INTO modules (id, name, description, difficulty, url, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nextId, module.name, module.description, module.difficulty, module.url || null, module.image || null]
      );

      // Insert vulnerabilities
      if (module.vulnerabilities && module.vulnerabilities.length > 0) {
        const vulnValues = module.vulnerabilities.map((vulnId) => [nextId, vulnId]);
        await db.query(
          "INSERT INTO module_vulnerabilities (module_id, vulnerability_id) VALUES ?",
          [vulnValues]
        );
      }

      return nextId;
    } catch (error) {
      console.error("Error creating module:", error);
      throw error;
    }
  }

  /**
   * Update a module
   */
  async updateModule(
    id: number,
    module: {
      name?: string;
      description?: string;
      difficulty?: ModuleDifficulty;
      url?: string;
      image?: string;
      vulnerabilities?: number[];
    }
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (module.name !== undefined) {
        updates.push("name = ?");
        values.push(module.name);
      }
      if (module.description !== undefined) {
        updates.push("description = ?");
        values.push(module.description);
      }
      if (module.difficulty !== undefined) {
        updates.push("difficulty = ?");
        values.push(module.difficulty);
      }
      if (module.url !== undefined) {
        updates.push("url = ?");
        values.push(module.url);
      }
      if (module.image !== undefined) {
        updates.push("image = ?");
        values.push(module.image);
      }

      if (updates.length > 0) {
        values.push(id);
        await db.query(
          `UPDATE modules SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      // Update vulnerabilities
      if (module.vulnerabilities !== undefined) {
        await db.query("DELETE FROM module_vulnerabilities WHERE module_id = ?", [id]);
        if (module.vulnerabilities.length > 0) {
          const vulnValues = module.vulnerabilities.map((vulnId) => [id, vulnId]);
          await db.query(
            "INSERT INTO module_vulnerabilities (module_id, vulnerability_id) VALUES ?",
            [vulnValues]
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Error updating module:", error);
      return false;
    }
  }

  /**
   * Delete a module
   */
  async deleteModule(id: number): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM modules WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting module:", error);
      return false;
    }
  }

  /**
   * Create a unit for a module
   */
  async createUnit(unit: {
    module_id: number;
    name: string;
    type: UnitType;
    sequence_order: number;
  }): Promise<number> {
    try {
      // Get next available ID
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM units"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      await db.query(
        `INSERT INTO units (id, module_id, name, type, sequence_order)
         VALUES (?, ?, ?, ?, ?)`,
        [nextId, unit.module_id, unit.name, unit.type, unit.sequence_order]
      );

      return nextId;
    } catch (error) {
      console.error("Error creating unit:", error);
      throw error;
    }
  }

  /**
   * Update a unit
   */
  async updateUnit(
    id: number,
    unit: {
      name?: string;
      type?: UnitType;
      sequence_order?: number;
    }
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (unit.name !== undefined) {
        updates.push("name = ?");
        values.push(unit.name);
      }
      if (unit.type !== undefined) {
        updates.push("type = ?");
        values.push(unit.type);
      }
      if (unit.sequence_order !== undefined) {
        updates.push("sequence_order = ?");
        values.push(unit.sequence_order);
      }

      if (updates.length === 0) {
        return true;
      }

      values.push(id);
      await db.query(`UPDATE units SET ${updates.join(", ")} WHERE id = ?`, values);

      return true;
    } catch (error) {
      console.error("Error updating unit:", error);
      return false;
    }
  }

  /**
   * Delete a unit
   */
  async deleteUnit(id: number): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM units WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting unit:", error);
      return false;
    }
  }

  // ============================================================================
  // VULNERABILITY MANAGEMENT
  // ============================================================================

  /**
   * Create a new vulnerability
   */
  async createVulnerability(name: string): Promise<number> {
    try {
      // Get next available ID
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM vulnerabilities"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      await db.query(
        "INSERT INTO vulnerabilities (id, name) VALUES (?, ?)",
        [nextId, name]
      );

      return nextId;
    } catch (error) {
      console.error("Error creating vulnerability:", error);
      throw error;
    }
  }

  /**
   * Update a vulnerability
   */
  async updateVulnerability(id: number, name: string): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "UPDATE vulnerabilities SET name = ? WHERE id = ?",
        [name, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating vulnerability:", error);
      return false;
    }
  }

  /**
   * Delete a vulnerability
   */
  async deleteVulnerability(id: number): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM vulnerabilities WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting vulnerability:", error);
      return false;
    }
  }

  // ============================================================================
  // EXAM MANAGEMENT
  // ============================================================================

  /**
   * Create a new exam
   */
  async createExam(exam: { name: string; logo?: string }): Promise<number> {
    try {
      // Get next available ID
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM exams"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      await db.query(
        "INSERT INTO exams (id, name, logo) VALUES (?, ?, ?)",
        [nextId, exam.name, exam.logo || null]
      );

      return nextId;
    } catch (error) {
      console.error("Error creating exam:", error);
      throw error;
    }
  }

  /**
   * Update an exam
   */
  async updateExam(
    id: number,
    exam: { name?: string; logo?: string }
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (exam.name !== undefined) {
        updates.push("name = ?");
        values.push(exam.name);
      }
      if (exam.logo !== undefined) {
        updates.push("logo = ?");
        values.push(exam.logo);
      }

      if (updates.length === 0) {
        return true;
      }

      values.push(id);
      const [result] = await db.query<ResultSetHeader>(
        `UPDATE exams SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating exam:", error);
      return false;
    }
  }

  /**
   * Delete an exam
   */
  async deleteExam(id: number): Promise<boolean> {
    try {
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM exams WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting exam:", error);
      return false;
    }
  }

  /**
   * Link modules to an exam
   */
  async linkModulesToExam(examId: number, moduleIds: number[]): Promise<boolean> {
    try {
      // Delete existing links
      await db.query("DELETE FROM module_exams WHERE exam_id = ?", [examId]);

      // Insert new links
      if (moduleIds.length > 0) {
        const values = moduleIds.map((moduleId) => [moduleId, examId]);
        await db.query(
          "INSERT INTO module_exams (module_id, exam_id) VALUES ?",
          [values]
        );
      }

      return true;
    } catch (error) {
      console.error("Error linking modules to exam:", error);
      return false;
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalMachines: number;
    totalModules: number;
    totalExams: number;
    totalVulnerabilities: number;
    adminCount: number;
    userCount: number;
  }> {
    try {
      const [userStats] = await db.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN u.role = 'Admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN u.role = 'User' THEN 1 ELSE 0 END) as users
         FROM user_sync us
         JOIN users u ON us.custom_user_id = u.id`
      );

      const [machineCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM machines"
      );

      const [moduleCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM modules"
      );

      const [examCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM exams"
      );

      const [vulnCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM vulnerabilities"
      );

      return {
        totalUsers: Number(userStats[0]?.total || 0),
        adminCount: Number(userStats[0]?.admins || 0),
        userCount: Number(userStats[0]?.users || 0),
        totalMachines: Number(machineCount[0]?.count || 0),
        totalModules: Number(moduleCount[0]?.count || 0),
        totalExams: Number(examCount[0]?.count || 0),
        totalVulnerabilities: Number(vulnCount[0]?.count || 0),
      };
    } catch (error) {
      console.error("Error getting platform stats:", error);
      throw error;
    }
  }

  // ============================================================================
  // RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Get machine relationships (modules, vulnerabilities, languages, areas)
   */
  async getMachineRelationships(machineId: number) {
    try {
      const [modules] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, m.difficulty, m.image
         FROM modules m
         INNER JOIN machine_modules mm ON m.id = mm.module_id
         WHERE mm.machine_id = ?`,
        [machineId]
      );

      const [vulnerabilities] = await db.query<RowDataPacket[]>(
        `SELECT v.id, v.name
         FROM vulnerabilities v
         INNER JOIN machine_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.machine_id = ?`,
        [machineId]
      );

      const [languages] = await db.query<RowDataPacket[]>(
        `SELECT language FROM machine_languages WHERE machine_id = ?`,
        [machineId]
      );

      const [areas] = await db.query<RowDataPacket[]>(
        `SELECT area_of_interest FROM machine_areas_of_interest WHERE machine_id = ?`,
        [machineId]
      );

      return {
        modules,
        vulnerabilities,
        languages: languages.map((row) => row.language),
        areasOfInterest: areas.map((row) => row.area_of_interest),
      };
    } catch (error) {
      console.error("Error getting machine relationships:", error);
      throw error;
    }
  }

  /**
   * Update machine-module relationships
   */
  async updateMachineModules(machineId: number, moduleIds: number[]) {
    try {
      await db.query("DELETE FROM machine_modules WHERE machine_id = ?", [
        machineId,
      ]);

      if (moduleIds.length > 0) {
        const values = moduleIds.map((moduleId) => [machineId, moduleId]);
        await db.query(
          "INSERT INTO machine_modules (machine_id, module_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating machine modules:", error);
      throw error;
    }
  }

  /**
   * Update machine-vulnerability relationships
   */
  async updateMachineVulnerabilities(
    machineId: number,
    vulnerabilityIds: number[]
  ) {
    try {
      await db.query(
        "DELETE FROM machine_vulnerabilities WHERE machine_id = ?",
        [machineId]
      );

      if (vulnerabilityIds.length > 0) {
        const values = vulnerabilityIds.map((vulnId) => [machineId, vulnId]);
        await db.query(
          "INSERT INTO machine_vulnerabilities (machine_id, vulnerability_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating machine vulnerabilities:", error);
      throw error;
    }
  }

  /**
   * Update machine languages
   */
  async updateMachineLanguages(machineId: number, languages: string[]) {
    try {
      await db.query("DELETE FROM machine_languages WHERE machine_id = ?", [
        machineId,
      ]);

      if (languages.length > 0) {
        const values = languages.map((lang) => [machineId, lang]);
        await db.query(
          "INSERT INTO machine_languages (machine_id, language) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating machine languages:", error);
      throw error;
    }
  }

  /**
   * Update machine areas of interest
   */
  async updateMachineAreasOfInterest(machineId: number, areas: string[]) {
    try {
      await db.query(
        "DELETE FROM machine_areas_of_interest WHERE machine_id = ?",
        [machineId]
      );

      if (areas.length > 0) {
        const values = areas.map((area) => [machineId, area]);
        await db.query(
          "INSERT INTO machine_areas_of_interest (machine_id, area_of_interest) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating machine areas of interest:", error);
      throw error;
    }
  }

  /**
   * Get module relationships (machines, vulnerabilities, exams, units)
   */
  async getModuleRelationships(moduleId: number) {
    try {
      const [machines] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, m.difficulty, m.os, m.image
         FROM machines m
         INNER JOIN machine_modules mm ON m.id = mm.machine_id
         WHERE mm.module_id = ?`,
        [moduleId]
      );

      const [vulnerabilities] = await db.query<RowDataPacket[]>(
        `SELECT v.id, v.name
         FROM vulnerabilities v
         INNER JOIN module_vulnerabilities mv ON v.id = mv.vulnerability_id
         WHERE mv.module_id = ?`,
        [moduleId]
      );

      const [exams] = await db.query<RowDataPacket[]>(
        `SELECT e.id, e.name, e.logo
         FROM exams e
         INNER JOIN module_exams me ON e.id = me.exam_id
         WHERE me.module_id = ?`,
        [moduleId]
      );

      const [units] = await db.query<RowDataPacket[]>(
        `SELECT id, name, type, sequence_order
         FROM units
         WHERE module_id = ?
         ORDER BY sequence_order`,
        [moduleId]
      );

      return {
        machines,
        vulnerabilities,
        exams,
        units,
      };
    } catch (error) {
      console.error("Error getting module relationships:", error);
      throw error;
    }
  }

  /**
   * Update module-machine relationships
   */
  async updateModuleMachines(moduleId: number, machineIds: number[]) {
    try {
      await db.query("DELETE FROM machine_modules WHERE module_id = ?", [
        moduleId,
      ]);

      if (machineIds.length > 0) {
        const values = machineIds.map((machineId) => [machineId, moduleId]);
        await db.query(
          "INSERT INTO machine_modules (machine_id, module_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating module machines:", error);
      throw error;
    }
  }

  /**
   * Update module-vulnerability relationships
   */
  async updateModuleVulnerabilities(
    moduleId: number,
    vulnerabilityIds: number[]
  ) {
    try {
      await db.query("DELETE FROM module_vulnerabilities WHERE module_id = ?", [
        moduleId,
      ]);

      if (vulnerabilityIds.length > 0) {
        const values = vulnerabilityIds.map((vulnId) => [moduleId, vulnId]);
        await db.query(
          "INSERT INTO module_vulnerabilities (module_id, vulnerability_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating module vulnerabilities:", error);
      throw error;
    }
  }

  /**
   * Update module-exam relationships
   */
  async updateModuleExams(moduleId: number, examIds: number[]) {
    try {
      await db.query("DELETE FROM module_exams WHERE module_id = ?", [
        moduleId,
      ]);

      if (examIds.length > 0) {
        const values = examIds.map((examId) => [moduleId, examId]);
        await db.query(
          "INSERT INTO module_exams (module_id, exam_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating module exams:", error);
      throw error;
    }
  }

  /**
   * Get exam relationships (modules)
   */
  async getExamRelationships(examId: number) {
    try {
      const [modules] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, m.difficulty, m.image
         FROM modules m
         INNER JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?`,
        [examId]
      );

      return {
        modules,
      };
    } catch (error) {
      console.error("Error getting exam relationships:", error);
      throw error;
    }
  }

  /**
   * Update exam-module relationships
   */
  async updateExamModules(examId: number, moduleIds: number[]) {
    try {
      await db.query("DELETE FROM module_exams WHERE exam_id = ?", [examId]);

      if (moduleIds.length > 0) {
        const values = moduleIds.map((moduleId) => [moduleId, examId]);
        await db.query(
          "INSERT INTO module_exams (module_id, exam_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating exam modules:", error);
      throw error;
    }
  }

  /**
   * Get vulnerability relationships (tools, machines, modules)
   */
  async getVulnerabilityRelationships(vulnerabilityId: number) {
    try {
      const [tools] = await db.query<RowDataPacket[]>(
        `SELECT tool FROM vulnerability_tools WHERE vulnerability_id = ?`,
        [vulnerabilityId]
      );

      const [machines] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, m.difficulty, m.os, m.image
         FROM machines m
         INNER JOIN machine_vulnerabilities mv ON m.id = mv.machine_id
         WHERE mv.vulnerability_id = ?`,
        [vulnerabilityId]
      );

      const [modules] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, m.difficulty, m.image
         FROM modules m
         INNER JOIN module_vulnerabilities mv ON m.id = mv.module_id
         WHERE mv.vulnerability_id = ?`,
        [vulnerabilityId]
      );

      return {
        tools: tools.map((row) => row.tool),
        machines,
        modules,
      };
    } catch (error) {
      console.error("Error getting vulnerability relationships:", error);
      throw error;
    }
  }

  /**
   * Update vulnerability tools
   */
  async updateVulnerabilityTools(vulnerabilityId: number, tools: string[]) {
    try {
      await db.query("DELETE FROM vulnerability_tools WHERE vulnerability_id = ?", [
        vulnerabilityId,
      ]);

      if (tools.length > 0) {
        const values = tools.map((tool) => [vulnerabilityId, tool]);
        await db.query(
          "INSERT INTO vulnerability_tools (vulnerability_id, tool) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating vulnerability tools:", error);
      throw error;
    }
  }

  /**
   * Update vulnerability-machine relationships
   */
  async updateVulnerabilityMachines(
    vulnerabilityId: number,
    machineIds: number[]
  ) {
    try {
      await db.query(
        "DELETE FROM machine_vulnerabilities WHERE vulnerability_id = ?",
        [vulnerabilityId]
      );

      if (machineIds.length > 0) {
        const values = machineIds.map((machineId) => [
          machineId,
          vulnerabilityId,
        ]);
        await db.query(
          "INSERT INTO machine_vulnerabilities (machine_id, vulnerability_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating vulnerability machines:", error);
      throw error;
    }
  }

  /**
   * Update vulnerability-module relationships
   */
  async updateVulnerabilityModules(
    vulnerabilityId: number,
    moduleIds: number[]
  ) {
    try {
      await db.query(
        "DELETE FROM module_vulnerabilities WHERE vulnerability_id = ?",
        [vulnerabilityId]
      );

      if (moduleIds.length > 0) {
        const values = moduleIds.map((moduleId) => [
          moduleId,
          vulnerabilityId,
        ]);
        await db.query(
          "INSERT INTO module_vulnerabilities (module_id, vulnerability_id) VALUES ?",
          [values]
        );
      }
    } catch (error) {
      console.error("Error updating vulnerability modules:", error);
      throw error;
    }
  }

  /**
   * Get all available entities for relationship selection
   */
  async getAvailableEntities() {
    try {
      const [machines] = await db.query<RowDataPacket[]>(
        "SELECT id, name, difficulty, os, image FROM machines ORDER BY name"
      );

      const [modules] = await db.query<RowDataPacket[]>(
        "SELECT id, name, difficulty, image FROM modules ORDER BY name"
      );

      const [vulnerabilities] = await db.query<RowDataPacket[]>(
        "SELECT id, name FROM vulnerabilities ORDER BY name"
      );

      const [exams] = await db.query<RowDataPacket[]>(
        "SELECT id, name, logo FROM exams ORDER BY name"
      );

      return {
        machines,
        modules,
        vulnerabilities,
        exams,
      };
    } catch (error) {
      console.error("Error getting available entities:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
