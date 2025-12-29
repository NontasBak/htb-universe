/**
 * HTB Scraper Database Service
 * Handles all database insertions for scraped HTB data
 */

import type { Pool, RowDataPacket } from "mysql2/promise";
import type {
  ModuleInsert,
  UnitInsert,
  MachineInsert,
  ExamInsert,
  VulnerabilityInsert,
  MachineTag,
} from "./types.js";

// ============================================================================
// Database Service Class
// ============================================================================

export class ScraperDatabase {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ==========================================================================
  // Module Operations
  // ==========================================================================

  /**
   * Insert or update a module
   */
  async insertModule(module: ModuleInsert): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO modules (id, name, description, difficulty, url, image)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          difficulty = VALUES(difficulty),
          url = VALUES(url),
          image = VALUES(image)
        `,
        [module.id, module.name, module.description, module.difficulty, module.url, module.image]
      );
      console.log(`✓ Module ${module.id} (${module.name}) inserted`);
    } catch (error) {
      console.error(`✗ Error inserting module ${module.id}:`, error instanceof Error ? error.message : error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // Unit Operations
  // ==========================================================================

  /**
   * Insert or update a unit
   */
  async insertUnit(unit: UnitInsert): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO units (id, module_id, sequence_order, name, type)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          sequence_order = VALUES(sequence_order),
          name = VALUES(name),
          type = VALUES(type)
        `,
        [unit.id, unit.module_id, unit.sequence_order, unit.name, unit.type]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting unit ${unit.id} for module ${unit.module_id}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert multiple units for a module
   */
  async insertUnits(units: UnitInsert[]): Promise<void> {
    if (units.length === 0) return;

    for (const unit of units) {
      await this.insertUnit(unit);
    }
    console.log(`✓ Inserted ${units.length} units for module ${units[0]!.module_id}`);
  }

  // ==========================================================================
  // Machine Operations
  // ==========================================================================

  /**
   * Insert or update a machine
   */
  async insertMachine(machine: MachineInsert): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO machines (id, name, synopsis, difficulty, os, url, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          synopsis = VALUES(synopsis),
          difficulty = VALUES(difficulty),
          os = VALUES(os),
          url = VALUES(url),
          image = VALUES(image)
        `,
        [machine.id, machine.name, machine.synopsis, machine.difficulty, machine.os, machine.url, machine.image]
      );
      console.log(`✓ Machine ${machine.name} inserted`);
    } catch (error) {
      console.error(`✗ Error inserting machine ${machine.name}:`, error instanceof Error ? error.message : error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all machine IDs from the database
   */
  async getAllMachineIds(): Promise<number[]> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM machines");
      return rows.map((row) => row.id as number);
    } catch (error) {
      console.error("✗ Error fetching machine IDs:", error instanceof Error ? error.message : error);
      return [];
    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // Exam Operations
  // ==========================================================================

  /**
   * Insert or update an exam
   */
  async insertExam(exam: ExamInsert): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO exams (id, name, logo)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          logo = VALUES(logo)
        `,
        [exam.id, exam.name, exam.logo]
      );
      console.log(`✓ Exam ${exam.name} inserted`);
    } catch (error) {
      console.error(`✗ Error inserting exam ${exam.name}:`, error instanceof Error ? error.message : error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert multiple exams
   */
  async insertExams(exams: ExamInsert[]): Promise<void> {
    for (const exam of exams) {
      await this.insertExam(exam);
    }
  }

  /**
   * Get all exam IDs from the database
   */
  async getAllExamIds(): Promise<number[]> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM exams");
      return rows.map((row) => row.id as number);
    } catch (error) {
      console.error("✗ Error fetching exam IDs:", error instanceof Error ? error.message : error);
      return [];
    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // Vulnerability Operations
  // ==========================================================================

  /**
   * Insert or update a vulnerability
   */
  async insertVulnerability(vulnerability: VulnerabilityInsert): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO vulnerabilities (id, name)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name)
        `,
        [vulnerability.id, vulnerability.name]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting vulnerability ${vulnerability.name}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert multiple vulnerabilities
   */
  async insertVulnerabilities(vulnerabilities: Map<number, string>): Promise<void> {
    for (const [id, name] of vulnerabilities) {
      await this.insertVulnerability({ id, name });
    }
    if (vulnerabilities.size > 0) {
      console.log(`✓ Inserted ${vulnerabilities.size} vulnerabilities`);
    }
  }

  // ==========================================================================
  // Relationship Operations
  // ==========================================================================

  /**
   * Insert machine-module relationship
   */
  async insertMachineModuleRelationship(machineId: number, moduleId: number): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO machine_modules (machine_id, module_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE machine_id = machine_id
        `,
        [machineId, moduleId]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting machine-module relationship (${machineId}, ${moduleId}):`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert module-exam relationship
   */
  async insertModuleExamRelationship(moduleId: number, examId: number): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO module_exams (module_id, exam_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE module_id = module_id
        `,
        [moduleId, examId]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting module-exam relationship (${moduleId}, ${examId}):`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert machine-vulnerability relationship
   */
  async insertMachineVulnerabilityRelationship(machineId: number, vulnerabilityId: number): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO machine_vulnerabilities (machine_id, vulnerability_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE machine_id = machine_id
        `,
        [machineId, vulnerabilityId]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting machine-vulnerability relationship (${machineId}, ${vulnerabilityId}):`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert machine-area of interest relationship
   */
  async insertMachineAreaOfInterest(machineId: number, areaOfInterest: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO machine_areas_of_interest (machine_id, area_of_interest)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE machine_id = machine_id
        `,
        [machineId, areaOfInterest]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting machine-area relationship (${machineId}, ${areaOfInterest}):`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert machine-language relationship
   */
  async insertMachineLanguage(machineId: number, language: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.query(
        `
        INSERT INTO machine_languages (machine_id, language)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE machine_id = machine_id
        `,
        [machineId, language]
      );
    } catch (error) {
      console.error(
        `✗ Error inserting machine-language relationship (${machineId}, ${language}):`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert machine tag relationships (vulnerabilities, areas of interest, languages)
   */
  async insertMachineTagRelationships(machineId: number, tags: MachineTag[]): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      for (const tag of tags) {
        switch (tag.category) {
          case "Vulnerability":
            await this.insertMachineVulnerabilityRelationship(machineId, tag.id);
            break;
          case "Area of Interest":
            await this.insertMachineAreaOfInterest(machineId, tag.name);
            break;
          case "Language":
            await this.insertMachineLanguage(machineId, tag.name);
            break;
          default:
            console.log(`⚠ Unknown tag category: ${tag.category} for tag: ${tag.name}`);
        }
      }
    } catch (error) {
      console.error(
        `✗ Error inserting machine tag relationships for machine ${machineId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Insert multiple machine-module relationships
   */
  async insertMachineModuleRelationships(relationships: Array<{ machineId: number; moduleId: number }>): Promise<void> {
    console.log(`Inserting ${relationships.length} machine-module relationships...`);
    for (const rel of relationships) {
      await this.insertMachineModuleRelationship(rel.machineId, rel.moduleId);
    }
    console.log(`✓ Machine-module relationships inserted`);
  }

  /**
   * Insert multiple module-exam relationships for a specific exam
   */
  async insertModuleExamRelationshipsForExam(examId: number, moduleIds: number[]): Promise<void> {
    for (const moduleId of moduleIds) {
      await this.insertModuleExamRelationship(moduleId, examId);
    }
    console.log(`✓ Inserted ${moduleIds.length} module-exam relationships for exam ${examId}`);
  }
}
