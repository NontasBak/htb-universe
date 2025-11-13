import { pool } from "./config.js";
import axios from "axios";
import "dotenv/config";

const DELAY_BETWEEN_REQUESTS = 2000;

// Utility functions
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTTP request helpers
function createModuleRequestHeaders() {
  return {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Cookie: process.env.HTB_COOKIE,
    Host: "academy.hackthebox.com",
    Pragma: "no-cache",
    Priority: "u=4",
    Referer: "https://academy.hackthebox.com/beta/module/17",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Gpc": "1",
    Te: "trailers",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
  };
}

function createMachineRequestHeaders() {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    Authorization: process.env.HTB_BEARER,
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Host: "labs.hackthebox.com",
    Origin: "https://app.hackthebox.com",
    Pragma: "no-cache",
    Referer: "https://app.hackthebox.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Sec-Gpc": "1",
    Te: "trailers",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
  };
}

async function fetchModuleData(moduleId) {
  try {
    const response = await axios.get(`https://academy.hackthebox.com/api/v2/modules/${moduleId}`, {
      headers: createModuleRequestHeaders(),
    });
    return response.status === 200 ? response.data.data : null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Module ${moduleId} not found - skipping`);
    } else {
      console.log(`Error fetching module ${moduleId}:`, error.message);
    }
    return null;
  }
}

async function fetchMachineData(machineName) {
  try {
    const response = await axios.get(`https://labs.hackthebox.com/api/v4/machine/profile/${machineName}`, {
      headers: createMachineRequestHeaders(),
    });
    return response.status === 200 ? response.data.info : null;
  } catch (error) {
    console.error(`Error fetching machine ${machineName}:`, error.message);
    return null;
  }
}

async function fetchMachineTags(machineId) {
  try {
    const response = await axios.get(`https://labs.hackthebox.com/api/v4/machine/tags/${machineId}`, {
      headers: createMachineRequestHeaders(),
    });
    return response.status === 200 && response.data.info ? response.data.info : [];
  } catch (error) {
    console.error(`Error fetching tags for machine ${machineId}:`, error.message);
    return [];
  }
}

async function fetchExamsData() {
  try {
    const response = await axios.get("https://academy.hackthebox.com/api/v2/external/public/labs/exams");
    return response.status === 200 ? response.data.data : [];
  } catch (error) {
    console.error(`Error fetching exams:`, error.message);
    return [];
  }
}

async function fetchExamModules(examId) {
  try {
    const response = await axios.get(
      `https://academy.hackthebox.com/api/v2/external/public/labs/relations/exams/${examId}`,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          Cookie: process.env.HTB_COOKIE,
          Host: "academy.hackthebox.com",
          Pragma: "no-cache",
          Referer:
            "https://academy.hackthebox.com/academy-relations/exams/htb-certified-junior-cybersecurity-associate",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Gpc": "1",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    return response.status === 200 ? response.data.data.modules : [];
  } catch (error) {
    console.error(`Error fetching exam ${examId} modules:`, error.message);
    return [];
  }
}

// Database operations
async function insertModule(moduleData) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO modules (id, name, description, difficulty, url, image)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        difficulty = EXCLUDED.difficulty,
        url = EXCLUDED.url,
        image = EXCLUDED.image
    `;

    await client.query(insertQuery, [
      moduleData.id,
      moduleData.name,
      moduleData.description,
      moduleData.difficulty,
      moduleData.url,
      moduleData.image,
    ]);

    console.log(`Module ${moduleData.id} (${moduleData.name}) inserted successfully`);
  } catch (dbError) {
    console.error(`Database error for module ${moduleData.id}:`, dbError.message);
  } finally {
    client.release();
  }
}

async function insertMachine(id, name, synopsis, difficulty, os, logo) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO machines (id, name, synopsis, difficulty, os, url, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        synopsis = EXCLUDED.synopsis,
        difficulty = EXCLUDED.difficulty,
        os = EXCLUDED.os,
        url = EXCLUDED.url,
        image = EXCLUDED.image
    `;

    await client.query(insertQuery, [
      id,
      name,
      synopsis,
      difficulty,
      os,
      `https://app.hackthebox.com/machines/${name}`,
      logo,
    ]);

    console.log(`Machine ${name} inserted successfully`);
  } catch (dbError) {
    console.error(`Database error for machine ${name}:`, dbError.message);
  } finally {
    client.release();
  }
}

async function insertExams(exams) {
  const client = await pool.connect();
  try {
    for (const exam of exams) {
      const insertQuery = `
        INSERT INTO exams (id, name, logo)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          logo = EXCLUDED.logo
      `;

      await client.query(insertQuery, [exam.id, exam.name, exam.logo]);
      console.log(`Exam ${exam.name} inserted successfully`);
    }
  } catch (dbError) {
    console.error(`Database error for exam:`, dbError.message);
  } finally {
    client.release();
  }
}

async function insertTagsByCategory(tags, tableName, categoryName) {
  const client = await pool.connect();
  try {
    for (const [id, name] of tags) {
      const insertQuery = `
        INSERT INTO ${tableName} (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name
      `;
      await client.query(insertQuery, [id, name]);
      console.log(`Inserted ${categoryName}: ${name}`);
    }
  } catch (error) {
    console.error(`Error inserting ${categoryName}:`, error.message);
  } finally {
    client.release();
  }
}

async function getAllMachineIds() {
  const client = await pool.connect();
  try {
    const machines = await client.query("SELECT id FROM machines");
    return machines.rows.map((row) => row.id);
  } catch (error) {
    console.error("Error fetching machine IDs:", error.message);
    return [];
  } finally {
    client.release();
  }
}

async function insertMachineModuleRelationship(machineId, moduleId) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO machine_modules (machine_id, module_id)
      VALUES ($1, $2)
      ON CONFLICT (machine_id, module_id) DO NOTHING
    `;
    await client.query(insertQuery, [machineId, moduleId]);
  } catch (error) {
    console.error(`Error inserting machine-module relationship (${machineId}, ${moduleId}):`, error.message);
  } finally {
    client.release();
  }
}

async function insertModuleExamRelationship(moduleId, examId) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO module_exams (module_id, exam_id)
      VALUES ($1, $2)
      ON CONFLICT (module_id, exam_id) DO NOTHING
    `;
    await client.query(insertQuery, [moduleId, examId]);
  } catch (error) {
    console.error(`Error inserting module-exam relationship (${moduleId}, ${examId}):`, error.message);
  } finally {
    client.release();
  }
}

async function insertMachineTagRelationships(machineId, tags) {
  const client = await pool.connect();
  try {
    for (const tag of tags) {
      let tableName;
      let columnName;

      switch (tag.category) {
        case "Area of Interest":
          tableName = "machine_areas_of_interest";
          columnName = "area_id";
          break;
        case "Vulnerability":
          tableName = "machine_vulnerabilities";
          columnName = "vulnerability_id";
          break;
        case "Language":
          tableName = "machine_languages";
          columnName = "language_id";
          break;
        default:
          continue; // Skip unknown categories
      }

      const insertQuery = `
        INSERT INTO ${tableName} (machine_id, ${columnName})
        VALUES ($1, $2)
        ON CONFLICT (machine_id, ${columnName}) DO NOTHING
      `;
      await client.query(insertQuery, [machineId, tag.id]);
    }
  } catch (error) {
    console.error(`Error inserting machine-tag relationships for machine ${machineId}:`, error.message);
  } finally {
    client.release();
  }
}

// Data processing helpers
function transformModuleData(data) {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    difficulty: data.difficulty.title,
    url: data.url.absolute,
    image: data.avatar || data.logo,
  };
}

function extractUniqueMachines(allMachines, relatedMachines) {
  relatedMachines.forEach((machine) => {
    allMachines.add(
      JSON.stringify({
        id: machine.id,
        name: machine.name,
        os: machine.os,
        difficulty: machine.difficulty,
        logo: machine.logo,
      }),
    );
  });
}

function categorizeTagsFromMachine(tags) {
  const areasOfInterest = new Map();
  const vulnerabilities = new Map();
  const languages = new Map();

  tags.forEach((tag) => {
    switch (tag.category) {
      case "Area of Interest":
        areasOfInterest.set(tag.id, tag.name);
        break;
      case "Vulnerability":
        vulnerabilities.set(tag.id, tag.name);
        break;
      case "Language":
        languages.set(tag.id, tag.name);
        break;
      default:
      // console.log(`Unknown tag category: ${tag.category} for tag: ${tag.name}`);
    }
  });

  return { areasOfInterest, vulnerabilities, languages };
}

// Main population functions
async function populateModuleTable() {
  const allMachines = new Set();
  const machineModuleRelationships = [];

  for (let i = 0; i <= 500; i++) {
    const moduleData = await fetchModuleData(i);

    if (moduleData) {
      const transformedData = transformModuleData(moduleData);
      await insertModule(transformedData);

      const relatedMachines = moduleData.related?.machines || [];

      // Store machine-module relationships
      relatedMachines.forEach((machine) => {
        machineModuleRelationships.push({
          machineId: machine.id,
          moduleId: moduleData.id,
        });
      });

      extractUniqueMachines(allMachines, relatedMachines);
    }

    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  // Process unique machines
  console.log(`Found ${allMachines.size} unique machines to process`);

  for (const machineStr of allMachines) {
    const machine = JSON.parse(machineStr);
    await processMachine(machine);
    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  // Insert machine-module relationships
  console.log(`Inserting ${machineModuleRelationships.length} machine-module relationships...`);
  for (const relationship of machineModuleRelationships) {
    await insertMachineModuleRelationship(relationship.machineId, relationship.moduleId);
  }
  console.log("Machine-module relationships inserted successfully!");
}

async function processMachine(machine) {
  const machineData = await fetchMachineData(machine.name);

  if (machineData) {
    console.log(`Machine ${machine.name} fetched successfully`);
    await insertMachine(
      machine.id,
      machine.name,
      machineData.synopsis,
      machine.difficulty,
      machine.os,
      machine.logo,
    );
  }
}

async function populateExamTable() {
  const exams = await fetchExamsData();
  if (exams.length > 0) {
    await insertExams(exams);
  }
}

async function populateTagsTables() {
  const machineIds = await getAllMachineIds();

  const globalAreasOfInterest = new Map();
  const globalVulnerabilities = new Map();
  const globalLanguages = new Map();

  console.log(`Processing tags for ${machineIds.length} machines...`);

  for (const id of machineIds) {
    const tags = await fetchMachineTags(id);

    if (tags.length > 0) {
      const { areasOfInterest, vulnerabilities, languages } = categorizeTagsFromMachine(tags);

      // Merge with global maps
      areasOfInterest.forEach((name, id) => globalAreasOfInterest.set(id, name));
      vulnerabilities.forEach((name, id) => globalVulnerabilities.set(id, name));
      languages.forEach((name, id) => globalLanguages.set(id, name));

      // Insert machine-tag relationships
      await insertMachineTagRelationships(id, tags);

      console.log(`Processed tags for machine ${id}`);
    }

    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  console.log(
    `Found ${globalAreasOfInterest.size} areas of interest, ${globalVulnerabilities.size} vulnerabilities, ${globalLanguages.size} languages`,
  );

  // Insert all categories
  await insertTagsByCategory(globalAreasOfInterest, "areas_of_interest", "area of interest");
  await insertTagsByCategory(globalVulnerabilities, "vulnerabilities", "vulnerability");
  await insertTagsByCategory(globalLanguages, "languages", "language");

  console.log("Tags population completed successfully!");
}

async function populateModuleExamRelationships() {
  const client = await pool.connect();
  try {
    // Get all exams
    const examsResult = await client.query("SELECT id FROM exams");
    const examIds = examsResult.rows.map((row) => row.id);

    console.log(`Processing module-exam relationships for ${examIds.length} exams...`);

    for (const examId of examIds) {
      const modules = await fetchExamModules(examId);

      console.log(`Found ${modules.length} modules for exam ${examId}`);

      for (const module of modules) {
        await insertModuleExamRelationship(module.id, examId);
      }

      await sleep(DELAY_BETWEEN_REQUESTS);
    }

    console.log("Module-exam relationships populated successfully!");
  } catch (error) {
    console.error("Error populating module-exam relationships:", error.message);
  } finally {
    client.release();
  }
}

async function main() {
  console.log("Starting data scraping...");

  console.log("1. Scraping modules and machines...");
  await populateModuleTable();

  console.log("2. Scraping exams...");
  await populateExamTable();

  console.log("3. Scraping tags tables...");
  await populateTagsTables();

  console.log("4. Scraping module-exam relationships...");
  await populateModuleExamRelationships();

  console.log("All data scraping completed successfully!");
}

main();
