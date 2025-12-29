import { db } from "../connection";
import type { CustomUser, UserRole, UserSync } from "../types";
import type { RowDataPacket } from "mysql2";

/**
 * User Sync Service
 *
 * This service manages the synchronization between:
 * - better-auth's `user` table (UUID-based, managed by better-auth)
 * - Custom `users` table (integer ID-based, legacy HTB system)
 *
 * The sync ensures that when a user registers/updates via better-auth,
 * the custom users table is also updated to maintain compatibility
 * with existing user_machines, user_modules, and user_exams tables.
 */
class UserSyncService {
  /**
   * Create a custom user entry when a better-auth user is created
   * This should be called after better-auth creates a user
   */
  async createCustomUser(authUserId: string, username: string, email: string, role: UserRole = "User"): Promise<number> {
    try {
      // Generate a new ID for the custom users table
      // We'll use a safe approach: get max ID and increment
      const [maxIdRows] = await db.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users"
      );
      const nextId = maxIdRows[0]?.next_id || 1;

      // Insert into custom users table
      await db.query(
        `INSERT INTO users (id, username, email, role) VALUES (?, ?, ?, ?)`,
        [nextId, username, email, role]
      );

      // Store the mapping in a sync table (we'll create this)
      await this.storeSyncMapping(authUserId, nextId, username, email, role);

      return nextId;
    } catch (error) {
      console.error("Error creating custom user:", error);
      throw new Error("Failed to create custom user");
    }
  }

  /**
   * Get custom user ID from auth user ID
   */
  async getCustomUserId(authUserId: string): Promise<number | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT custom_user_id FROM user_sync WHERE auth_user_id = ?`,
        [authUserId]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0]?.custom_user_id || null;
    } catch (error) {
      console.error("Error getting custom user ID:", error);
      return null;
    }
  }

  /**
   * Get auth user ID from custom user ID
   */
  async getAuthUserId(customUserId: number): Promise<string | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT auth_user_id FROM user_sync WHERE custom_user_id = ?`,
        [customUserId]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0]?.auth_user_id || null;
    } catch (error) {
      console.error("Error getting auth user ID:", error);
      return null;
    }
  }

  /**
   * Get full user sync info
   */
  async getUserSync(authUserId: string): Promise<UserSync | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT auth_user_id, custom_user_id, username, email, role, created_at, updated_at
         FROM user_sync
         WHERE auth_user_id = ?`,
        [authUserId]
      );

      if (rows.length === 0) {
        return null;
      }

      return {
        auth_user_id: rows[0]!.auth_user_id,
        custom_user_id: rows[0]!.custom_user_id,
        username: rows[0]!.username,
        email: rows[0]!.email,
        role: rows[0]!.role,
        created_at: rows[0]!.created_at,
        updated_at: rows[0]!.updated_at,
      };
    } catch (error) {
      console.error("Error getting user sync:", error);
      return null;
    }
  }

  /**
   * Update custom user when better-auth user is updated
   */
  async updateCustomUser(authUserId: string, updates: { username?: string; email?: string }): Promise<boolean> {
    try {
      const customUserId = await this.getCustomUserId(authUserId);
      if (!customUserId) {
        console.error("No custom user found for auth user:", authUserId);
        return false;
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.username !== undefined) {
        updateFields.push("username = ?");
        updateValues.push(updates.username);
      }

      if (updates.email !== undefined) {
        updateFields.push("email = ?");
        updateValues.push(updates.email);
      }

      if (updateFields.length === 0) {
        return true; // Nothing to update
      }

      updateValues.push(customUserId);

      await db.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      // Update sync table
      const syncUpdateFields: string[] = [];
      const syncUpdateValues: any[] = [];

      if (updates.username !== undefined) {
        syncUpdateFields.push("username = ?");
        syncUpdateValues.push(updates.username);
      }

      if (updates.email !== undefined) {
        syncUpdateFields.push("email = ?");
        syncUpdateValues.push(updates.email);
      }

      if (syncUpdateFields.length > 0) {
        syncUpdateValues.push(authUserId);
        await db.query(
          `UPDATE user_sync SET ${syncUpdateFields.join(", ")} WHERE auth_user_id = ?`,
          syncUpdateValues
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating custom user:", error);
      return false;
    }
  }

  /**
   * Get custom user by ID
   */
  async getCustomUserById(customUserId: number): Promise<CustomUser | null> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT id, username, email, password, role FROM users WHERE id = ?`,
        [customUserId]
      );

      if (rows.length === 0) {
        return null;
      }

      return {
        id: rows[0]!.id,
        username: rows[0]!.username,
        email: rows[0]!.email,
        password: rows[0]!.password,
        role: rows[0]!.role,
      };
    } catch (error) {
      console.error("Error getting custom user:", error);
      return null;
    }
  }

  /**
   * Check if user sync table exists, create if not
   */
  async ensureSyncTableExists(): Promise<void> {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_sync (
          auth_user_id VARCHAR(36) NOT NULL PRIMARY KEY,
          custom_user_id INT NOT NULL UNIQUE,
          username VARCHAR(30) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (auth_user_id) REFERENCES user(id) ON DELETE CASCADE,
          FOREIGN KEY (custom_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_custom_user_id (custom_user_id),
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
    } catch (error) {
      console.error("Error ensuring sync table exists:", error);
      throw error;
    }
  }

  /**
   * Store mapping between auth user and custom user
   */
  private async storeSyncMapping(
    authUserId: string,
    customUserId: number,
    username: string,
    email: string,
    role: UserRole
  ): Promise<void> {
    try {
      await this.ensureSyncTableExists();

      await db.query(
        `INSERT INTO user_sync (auth_user_id, custom_user_id, username, email, role)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         email = VALUES(email),
         role = VALUES(role)`,
        [authUserId, customUserId, username, email, role]
      );
    } catch (error) {
      console.error("Error storing sync mapping:", error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(authUserId: string, role: UserRole): Promise<boolean> {
    try {
      const customUserId = await this.getCustomUserId(authUserId);
      if (!customUserId) {
        return false;
      }

      await db.query(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, customUserId]
      );

      await db.query(
        `UPDATE user_sync SET role = ? WHERE auth_user_id = ?`,
        [role, authUserId]
      );

      return true;
    } catch (error) {
      console.error("Error updating user role:", error);
      return false;
    }
  }

  /**
   * Delete user (both tables)
   */
  async deleteUser(authUserId: string): Promise<boolean> {
    try {
      const customUserId = await this.getCustomUserId(authUserId);
      if (!customUserId) {
        return false;
      }

      // The sync table entry will be deleted automatically due to CASCADE
      // But we need to delete from custom users table first
      await db.query(`DELETE FROM users WHERE id = ?`, [customUserId]);

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username: string, excludeAuthUserId?: string): Promise<boolean> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        excludeAuthUserId
          ? `SELECT COUNT(*) as count FROM user_sync WHERE username = ? AND auth_user_id != ?`
          : `SELECT COUNT(*) as count FROM user_sync WHERE username = ?`,
        excludeAuthUserId ? [username, excludeAuthUserId] : [username]
      );

      return rows[0]?.count === 0;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  }

  /**
   * Get all users with sync info (admin only)
   */
  async getAllUsersWithSync(limit: number = 50, offset: number = 0): Promise<UserSync[]> {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT auth_user_id, custom_user_id, username, email, role, created_at, updated_at
         FROM user_sync
         ORDER BY custom_user_id
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return rows.map(row => ({
        auth_user_id: row.auth_user_id,
        custom_user_id: row.custom_user_id,
        username: row.username,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error("Error getting all users with sync:", error);
      return [];
    }
  }
}

export const userSyncService = new UserSyncService();
export default userSyncService;
