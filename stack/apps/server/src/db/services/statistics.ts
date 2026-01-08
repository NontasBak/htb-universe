import { db } from "../connection";
import type { UserStatistics, GlobalStatistics } from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * Statistics Service
 *
 * Handles all database operations related to user and global statistics
 */
class StatisticsService {
  /**
   * Get user statistics (implements logic from query4.sql)
   */
  async getUserStatistics(userId: number): Promise<UserStatistics> {
    try {
      // Get total counts
      const [machinesCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_machines WHERE user_id = ?",
        [userId]
      );

      const [modulesCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_modules WHERE user_id = ?",
        [userId]
      );

      const [examsCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_exams WHERE user_id = ?",
        [userId]
      );

      // Get machines by difficulty
      const [machinesByDifficulty] = await db.query<RowDataPacket[]>(
        `SELECT m.difficulty, COUNT(*) as count
         FROM user_machines um
         JOIN machines m ON um.machine_id = m.id
         WHERE um.user_id = ?
         GROUP BY m.difficulty`,
        [userId]
      );

      const difficultyMap: Record<string, number> = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
        Insane: 0,
      };

      machinesByDifficulty.forEach(row => {
        if (row.difficulty in difficultyMap) {
          difficultyMap[row.difficulty] = row.count;
        }
      });

      // Get modules by difficulty
      const [modulesByDifficulty] = await db.query<RowDataPacket[]>(
        `SELECT m.difficulty, COUNT(*) as count
         FROM user_modules um
         JOIN modules m ON um.module_id = m.id
         WHERE um.user_id = ?
         GROUP BY m.difficulty`,
        [userId]
      );

      const moduleDifficultyMap: Record<string, number> = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
        Very_Easy: 0,
      };

      modulesByDifficulty.forEach(row => {
        if (row.difficulty in moduleDifficultyMap) {
          moduleDifficultyMap[row.difficulty] = row.count;
        }
      });

      // Get recent activity
      const [recentMachines] = await db.query<RowDataPacket[]>(
        `SELECT 'machine' as type, m.id, m.name, um.date
         FROM user_machines um
         JOIN machines m ON um.machine_id = m.id
         WHERE um.user_id = ?
         ORDER BY um.date DESC
         LIMIT 5`,
        [userId]
      );

      const [recentModules] = await db.query<RowDataPacket[]>(
        `SELECT 'module' as type, m.id, m.name, um.date
         FROM user_modules um
         JOIN modules m ON um.module_id = m.id
         WHERE um.user_id = ?
         ORDER BY um.date DESC
         LIMIT 5`,
        [userId]
      );

      const [recentExams] = await db.query<RowDataPacket[]>(
        `SELECT 'exam' as type, e.id, e.name, ue.date
         FROM user_exams ue
         JOIN exams e ON ue.exam_id = e.id
         WHERE ue.user_id = ?
         ORDER BY ue.date DESC
         LIMIT 5`,
        [userId]
      );

      // Combine and sort recent activity
      const recentActivity = [
        ...recentMachines,
        ...recentModules,
        ...recentExams,
      ]
        .sort((a, b) => (b.date || 0) - (a.date || 0))
        .slice(0, 10)
        .map(row => ({
          type: row.type as "machine" | "module" | "exam",
          id: row.id,
          name: row.name,
          date: row.date,
        }));

      return {
        totalMachines: machinesCount[0]?.count || 0,
        totalModules: modulesCount[0]?.count || 0,
        totalExams: examsCount[0]?.count || 0,
        machinesByDifficulty: difficultyMap as UserStatistics["machinesByDifficulty"],
        modulesByDifficulty: moduleDifficultyMap as UserStatistics["modulesByDifficulty"],
        recentActivity,
      };
    } catch (error) {
      console.error("Error getting user statistics:", error);
      throw new Error("Failed to get user statistics");
    }
  }

  /**
   * Get global statistics
   */
  async getGlobalStatistics(): Promise<GlobalStatistics> {
    try {
      // Get total counts
      const [usersCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM users"
      );

      const [machinesCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM machines"
      );

      const [modulesCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM modules"
      );

      const [examsCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM exams"
      );

      const [vulnerabilitiesCount] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM vulnerabilities"
      );

      // Get popular machines
      const [popularMachines] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, COUNT(um.user_id) as completions
         FROM machines m
         LEFT JOIN user_machines um ON m.id = um.machine_id
         GROUP BY m.id
         ORDER BY completions DESC, m.rating DESC
         LIMIT 10`
      );

      // Get popular modules
      const [popularModules] = await db.query<RowDataPacket[]>(
        `SELECT m.id, m.name, COUNT(um.user_id) as completions
         FROM modules m
         LEFT JOIN user_modules um ON m.id = um.module_id
         GROUP BY m.id
         ORDER BY completions DESC, m.tier
         LIMIT 10`
      );

      return {
        totalUsers: usersCount[0]?.count || 0,
        totalMachines: machinesCount[0]?.count || 0,
        totalModules: modulesCount[0]?.count || 0,
        totalExams: examsCount[0]?.count || 0,
        totalVulnerabilities: vulnerabilitiesCount[0]?.count || 0,
        popularMachines: popularMachines.map(row => ({
          id: row.id,
          name: row.name,
          completions: row.completions,
        })),
        popularModules: popularModules.map(row => ({
          id: row.id,
          name: row.name,
          completions: row.completions,
        })),
      };
    } catch (error) {
      console.error("Error getting global statistics:", error);
      throw new Error("Failed to get global statistics");
    }
  }

  /**
   * Get user progress percentage for all exams
   */
  async getUserExamProgress(userId: number): Promise<Array<{
    examId: number;
    examName: string;
    totalModules: number;
    completedModules: number;
    progressPercentage: number;
  }>> {
    try {
      // Use EXAM_GUIDE view for simplified query
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
          eg.exam_id,
          eg.exam_name,
          COUNT(DISTINCT eg.module_id) as total_modules,
          COUNT(DISTINCT um.module_id) as completed_modules,
          ROUND(
            (COUNT(DISTINCT um.module_id) / COUNT(DISTINCT eg.module_id)) * 100,
            2
          ) as progress_percentage
         FROM EXAM_GUIDE eg
         LEFT JOIN user_modules um ON eg.module_id = um.module_id AND um.user_id = ?
         GROUP BY eg.exam_id, eg.exam_name
         ORDER BY progress_percentage DESC, eg.exam_id`,
        [userId]
      );

      return rows.map(row => ({
        examId: row.exam_id,
        examName: row.exam_name,
        totalModules: row.total_modules,
        completedModules: row.completed_modules,
        progressPercentage: parseFloat(row.progress_percentage) || 0,
      }));
    } catch (error) {
      console.error("Error getting user exam progress:", error);
      throw new Error("Failed to get user exam progress");
    }
  }

  /**
   * Get leaderboard by machines completed
   */
  async getMachineLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    username: string;
    machinesCompleted: number;
  }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT u.id, u.username, COUNT(um.machine_id) as machines_completed
         FROM users u
         LEFT JOIN user_machines um ON u.id = um.user_id
         GROUP BY u.id, u.username
         ORDER BY machines_completed DESC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => ({
        userId: row.id,
        username: row.username || "Unknown",
        machinesCompleted: row.machines_completed,
      }));
    } catch (error) {
      console.error("Error getting machine leaderboard:", error);
      throw new Error("Failed to get machine leaderboard");
    }
  }

  /**
   * Get leaderboard by modules completed
   */
  async getModuleLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    username: string;
    modulesCompleted: number;
  }>> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT u.id, u.username, COUNT(um.module_id) as modules_completed
         FROM users u
         LEFT JOIN user_modules um ON u.id = um.user_id
         GROUP BY u.id, u.username
         ORDER BY modules_completed DESC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => ({
        userId: row.id,
        username: row.username || "Unknown",
        modulesCompleted: row.modules_completed,
      }));
    } catch (error) {
      console.error("Error getting module leaderboard:", error);
      throw new Error("Failed to get module leaderboard");
    }
  }

  /**
   * Get completion rate for a specific machine
   */
  async getMachineCompletionRate(machineId: number): Promise<{
    machineId: number;
    totalUsers: number;
    completions: number;
    completionRate: number;
  }> {
    try {
      const [totalUsers] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM users"
      );

      const [completions] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_machines WHERE machine_id = ?",
        [machineId]
      );

      const total = totalUsers[0]?.count || 0;
      const completed = completions[0]?.count || 0;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      return {
        machineId,
        totalUsers: total,
        completions: completed,
        completionRate: Math.round(rate * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting machine completion rate:", error);
      throw new Error("Failed to get machine completion rate");
    }
  }

  /**
   * Get completion rate for a specific module
   */
  async getModuleCompletionRate(moduleId: number): Promise<{
    moduleId: number;
    totalUsers: number;
    completions: number;
    completionRate: number;
  }> {
    try {
      const [totalUsers] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM users"
      );

      const [completions] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM user_modules WHERE module_id = ?",
        [moduleId]
      );

      const total = totalUsers[0]?.count || 0;
      const completed = completions[0]?.count || 0;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      return {
        moduleId,
        totalUsers: total,
        completions: completed,
        completionRate: Math.round(rate * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting module completion rate:", error);
      throw new Error("Failed to get module completion rate");
    }
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
