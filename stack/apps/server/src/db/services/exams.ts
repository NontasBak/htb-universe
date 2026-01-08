import { db } from "../connection";
import type {
  Exam,
  ExamWithDetails,
  Module,
  Machine,
} from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * Exam Service
 *
 * Handles all database operations related to HTB certification exams
 */
class ExamService {
  /**
   * Get all exams
   */
  async getExams(): Promise<Exam[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM exams ORDER BY id"
      );

      return rows as Exam[];
    } catch (error) {
      console.error("Error getting exams:", error);
      throw new Error("Failed to get exams");
    }
  }

  /**
   * Get exam by ID with all related details
   */
  async getExamById(id: number): Promise<ExamWithDetails | null> {
    try {
      // Get exam
      const [examRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM exams WHERE id = ?",
        [id]
      );

      if (examRows.length === 0) {
        return null;
      }

      const exam = examRows[0] as Exam;

      // Get required modules using EXAM_GUIDE view
      const [moduleRows] = await db.query<RowDataPacket[]>(
        `SELECT
           m.id,
           m.name,
           m.description,
           m.difficulty
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         ORDER BY m.name`,
        [id]
      );

      return {
        ...exam,
        modules: moduleRows as Module[],
      };
    } catch (error) {
      console.error("Error getting exam by ID:", error);
      return null;
    }
  }

  /**
   * Get required modules for an exam
   */
  async getExamModules(examId: number): Promise<Module[]> {
    try {
      // Use EXAM_GUIDE view for simplified query
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
           m.id,
           m.name,
           m.description,
           m.difficulty
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         ORDER BY m.name`,
        [examId]
      );

      return rows as Module[];
    } catch (error) {
      console.error("Error getting exam modules:", error);
      throw new Error("Failed to get exam modules");
    }
  }

  /**
   * Get machines for exam preparation using EXAM_PREP_MACHINES view
   * Returns all machines that help practice modules required for the exam
   */
  async getMachinesByExam(examId: number): Promise<Array<{
    machine: Machine;
    modules: Module[];
  }>> {
    try {
      // Query the EXAM_PREP_MACHINES view
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
           mac.id as machine_id,
           mac.name as machine_name,
           mac.difficulty as machine_difficulty,
           mac.os as machine_os,
           mac.synopsis as machine_synopsis,
           mac.rating as machine_rating,
           m.id as module_id,
           m.name as module_name
         FROM machines mac
         JOIN machine_modules mm ON mac.id = mm.machine_id
         JOIN modules m ON mm.module_id = m.id
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         ORDER BY mac.name, m.name`,
        [examId]
      );

      // Group machines with their related modules
      const machineMap = new Map<number, {
        machine: Machine;
        modules: Module[];
      }>();

      rows.forEach((row: any) => {
        const machineId = row.machine_id;

        if (!machineMap.has(machineId)) {
          machineMap.set(machineId, {
            machine: {
              id: row.machine_id,
              name: row.machine_name,
              difficulty: row.machine_difficulty,
              os: row.machine_os,
              synopsis: row.machine_synopsis,
              rating: row.machine_rating,
              url: null,
              image: null,
            } as Machine,
            modules: [],
          });
        }

        // Add module to the machine's module list
        const entry = machineMap.get(machineId)!;
        entry.modules.push({
          id: row.module_id,
          name: row.module_name,
          description: null,
          difficulty: null,
          url: null,
          image: null,
        } as Module);
      });

      return Array.from(machineMap.values());
    } catch (error) {
      console.error("Error getting machines by exam:", error);
      throw new Error("Failed to get machines by exam");
    }
  }

  /**
   * Mark exam as completed for a user
   */
  async completeExam(userId: number, examId: number): Promise<boolean> {
    try {
      const date = Math.floor(Date.now() / 1000); // Unix timestamp

      await db.query(
        `INSERT INTO user_exams (user_id, exam_id, date)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         date = VALUES(date)`,
        [userId, examId, date]
      );

      return true;
    } catch (error) {
      console.error("Error completing exam:", error);
      return false;
    }
  }

  /**
   * Remove exam completion for a user
   */
  async uncompleteExam(userId: number, examId: number): Promise<boolean> {
    try {
      await db.query(
        "DELETE FROM user_exams WHERE user_id = ? AND exam_id = ?",
        [userId, examId]
      );

      return true;
    } catch (error) {
      console.error("Error uncompleting exam:", error);
      return false;
    }
  }

  /**
   * Get user's completed exams
   */
  async getUserCompletedExams(userId: number): Promise<Array<{ exam: Exam; date: number }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT e.*, ue.date
         FROM exams e
         JOIN user_exams ue ON e.id = ue.exam_id
         WHERE ue.user_id = ?
         ORDER BY ue.date DESC`,
        [userId]
      );

      return rows.map(row => ({
        exam: {
          id: row.id,
          name: row.name,
          logo: row.logo,
        } as Exam,
        date: row.date,
      }));
    } catch (error) {
      console.error("Error getting user completed exams:", error);
      return [];
    }
  }

  /**
   * Check if user has completed an exam
   */
  async hasUserCompletedExam(userId: number, examId: number): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT 1 FROM user_exams WHERE user_id = ? AND exam_id = ?",
        [userId, examId]
      );

      return rows.length > 0;
    } catch (error) {
      console.error("Error checking if user completed exam:", error);
      return false;
    }
  }

  /**
   * Get exam preparation progress for a user
   * Returns completed and incomplete modules for the exam
   */
  async getExamProgress(userId: number, examId: number): Promise<{
    exam: Exam | null;
    totalModules: number;
    completedModules: number;
    incompleteModules: Module[];
    completedModulesList: Module[];
    progressPercentage: number;
  }> {
    try {
      // Get exam
      const [examRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM exams WHERE id = ?",
        [examId]
      );

      if (examRows.length === 0) {
        return {
          exam: null,
          totalModules: 0,
          completedModules: 0,
          incompleteModules: [],
          completedModulesList: [],
          progressPercentage: 0,
        };
      }

      const exam = examRows[0] as Exam;

      // Get all required modules using EXAM_GUIDE view
      const [allModulesRows] = await db.query<RowDataPacket[]>(
        `SELECT
           m.id,
           m.name,
           m.description,
           m.difficulty
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?`,
        [examId]
      );

      const totalModules = allModulesRows.length;

      // Get completed modules using EXAM_GUIDE view
      const [completedRows] = await db.query<RowDataPacket[]>(
        `SELECT
           m.id,
           m.name,
           m.description,
           m.difficulty
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         JOIN user_modules um ON m.id = um.module_id
         WHERE me.exam_id = ? AND um.user_id = ?`,
        [examId, userId]
      );

      // Get incomplete modules using EXAM_GUIDE view
      const [incompleteRows] = await db.query<RowDataPacket[]>(
        `SELECT
           m.id,
           m.name,
           m.description,
           m.difficulty
         FROM modules m
         JOIN module_exams me ON m.id = me.module_id
         WHERE me.exam_id = ?
         AND m.id NOT IN (
           SELECT module_id
           FROM user_modules
           WHERE user_id = ?
         )
         ORDER BY m.name`,
        [examId, userId]
      );

      const completedModules = completedRows.length;
      const progressPercentage = totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      return {
        exam,
        totalModules,
        completedModules,
        incompleteModules: incompleteRows as Module[],
        completedModulesList: completedRows as Module[],
        progressPercentage,
      };
    } catch (error) {
      console.error("Error getting exam progress:", error);
      throw new Error("Failed to get exam progress");
    }
  }
}

export const examService = new ExamService();
export default examService;
