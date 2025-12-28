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

      CREATE TABLE IF NOT EXISTS areas_of_interest (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vulnerabilities (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS languages (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS machine_modules (
        machine_id INT NOT NULL,
        module_id INT NOT NULL,
        PRIMARY KEY (machine_id, module_id),
        FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS module_exams (
        module_id INT NOT NULL,
        exam_id INT NOT NULL,
        PRIMARY KEY (module_id, exam_id),
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS machine_areas_of_interest (
        machine_id INT NOT NULL,
        area_id INT NOT NULL,
        PRIMARY KEY (machine_id, area_id),
        FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
        FOREIGN KEY (area_id) REFERENCES areas_of_interest(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS machine_vulnerabilities (
        machine_id INT NOT NULL,
        vulnerability_id INT NOT NULL,
        PRIMARY KEY (machine_id, vulnerability_id),
        FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
        FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS machine_languages (
        machine_id INT NOT NULL,
        language_id INT NOT NULL,
        PRIMARY KEY (machine_id, language_id),
        FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
        FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
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
