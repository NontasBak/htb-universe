import { db } from "../src/db/connection";
import * as fs from "fs";
import * as path from "path";

/**
 * Migration Script: Add Database Views
 *
 * This script adds two views to the database:
 * 1. EXAM_GUIDE - Simplifies exam and module relationship queries
 * 2. EXAM_PREP_MACHINES - Finds machines for exam preparation
 */

async function addViews() {
  try {
    console.log("🚀 Starting database view migration...\n");

    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, "../../../../agents/add-views.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");

    // Split by semicolons to execute statements separately
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 &&
          !stmt.startsWith("--") &&
          !stmt.startsWith("/*")
      );

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (const statement of statements) {
      // Skip comments and empty statements
      if (
        !statement ||
        statement.trim().length === 0 ||
        statement.trim().startsWith("--")
      ) {
        continue;
      }

      try {
        await db.query(statement);

        // Log progress for important statements
        if (statement.includes("DROP VIEW")) {
          console.log("🗑️  Dropped existing views (if any)");
        } else if (statement.includes("CREATE VIEW `EXAM_GUIDE`")) {
          console.log("✅ Created view: EXAM_GUIDE");
        } else if (statement.includes("CREATE VIEW `EXAM_PREP_MACHINES`")) {
          console.log("✅ Created view: EXAM_PREP_MACHINES");
        }
      } catch (error: any) {
        // Ignore "view doesn't exist" errors on DROP
        if (error.code === "ER_BAD_TABLE_ERROR") {
          continue;
        }
        throw error;
      }
    }

    console.log("\n🎉 Migration completed successfully!\n");

    // Verify views were created
    console.log("🔍 Verifying views...\n");

    const [examGuideRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM EXAM_GUIDE"
    );
    console.log(
      `   EXAM_GUIDE: ${examGuideRows[0].count} exam-module relationships`
    );

    const [examPrepRows]: any = await db.query(
      "SELECT COUNT(*) as count FROM EXAM_PREP_MACHINES"
    );
    console.log(
      `   EXAM_PREP_MACHINES: ${examPrepRows[0].count} exam-machine relationships`
    );

    console.log("\n✨ Views are ready to use!\n");
  } catch (error) {
    console.error("❌ Error adding views:", error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the migration
addViews()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
