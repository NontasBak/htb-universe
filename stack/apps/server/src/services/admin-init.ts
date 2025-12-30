import { env } from "@my-better-t-app/env/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "../db/connection";
import { services } from "../db";
import type { RowDataPacket } from "mysql2";

/**
 * Admin Initialization Service
 *
 * Ensures that the admin user specified in environment variables exists in the database.
 * This runs on server startup to guarantee at least one admin user is available.
 */

/**
 * Check if a user exists in better-auth's user table by email
 */
async function checkBetterAuthUserExists(email: string): Promise<string | null> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM user WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return rows[0]!.id;
    }
    return null;
  } catch (error) {
    console.error("Error checking better-auth user:", error);
    return null;
  }
}

/**
 * Delete admin user from all tables
 */
async function deleteAdminUser(email: string): Promise<void> {
  try {
    // Delete in reverse order of foreign key dependencies
    await db.query("DELETE FROM account WHERE providerId = 'credential' AND accountId = ?", [email]);
    await db.query("DELETE FROM user WHERE email = ?", [email]);
    await db.query("DELETE FROM user_sync WHERE email = ?", [email]);
    await db.query("DELETE FROM users WHERE email = ?", [email]);
    console.log(`🗑️  Deleted existing admin user: ${email}`);
  } catch (error) {
    // Ignore errors if user doesn't exist
    console.log(`ℹ️  No existing admin user to delete`);
  }
}

/**
 * Create a user using better-auth's signup API
 */
async function createBetterAuthUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  try {
    // Use better-auth's API to properly create user with hashed password
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result || !result.user) {
      throw new Error("Failed to create user via better-auth API");
    }

    console.log(`✅ Created better-auth user: ${email}`);
    return result.user.id;
  } catch (error: any) {
    console.error("Error creating better-auth user:", error);
    throw error;
  }
}

/**
 * Initialize admin user on server startup
 */
export async function initializeAdminUser(): Promise<void> {
  try {
    console.log("🔧 Initializing admin user...");

    const adminName = env.ADMIN_NAME;
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    // Step 1: Delete existing admin user (ensures fresh password hash)
    await deleteAdminUser(adminEmail);

    // Step 2: Create admin user with proper password hashing
    console.log(`📝 Creating admin user: ${adminEmail}`);
    const authUserId = await createBetterAuthUser(adminName, adminEmail, adminPassword);

    // Step 3: Create custom user and sync mapping
    console.log(`📝 Creating custom user and sync mapping for admin...`);
    const username = adminName.replace(/\s+/g, "_").toLowerCase();
    await services.userSync.createCustomUser(authUserId, username, adminEmail, "Admin");

    const userSync = await services.userSync.getUserSync(authUserId);
    if (!userSync) {
      throw new Error("Failed to create user sync mapping for admin");
    }

    console.log(`✅ Admin user initialized successfully!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Auth ID: ${authUserId}`);
    console.log(`   Custom ID: ${userSync.custom_user_id}`);
    console.log(`   Role: Admin`);
  } catch (error) {
    console.error("❌ Failed to initialize admin user:", error);
    throw error;
  }
}

/**
 * Validate admin credentials (useful for testing)
 */
export async function validateAdminExists(): Promise<boolean> {
  try {
    const adminEmail = env.ADMIN_EMAIL;
    const authUserId = await checkBetterAuthUserExists(adminEmail);

    if (!authUserId) {
      return false;
    }

    const userSync = await services.userSync.getUserSync(authUserId);
    return userSync?.role === "Admin";
  } catch (error) {
    console.error("Error validating admin:", error);
    return false;
  }
}
