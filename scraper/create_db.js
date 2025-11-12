import { pool } from "./config.js";

async function createDB() {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL...");

    const SQL = `
      CREATE TABLE IF NOT EXISTS modules (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(255),
        url VARCHAR(255),
        image VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS machines (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        synopsis TEXT,
        difficulty VARCHAR(255),
        os VARCHAR(255),
        url VARCHAR(255),
        image VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS exams (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo VARCHAR(255)
      );
    `;

    console.log("Creating tables...");
    await client.query(SQL);
    console.log("Tables created successfully!");
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    client.release();
    console.log("Database connection closed.");
  }
}

createDB()
  .then(() => {
    console.log("Database setup completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
