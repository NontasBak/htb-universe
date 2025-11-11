import { pool } from "./config.js";
import axios from "axios";
import "dotenv/config";

const DELAY_BETWEEN_REQUESTS = 2000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function populateModuleTable() {
  const machines = new Set();

  for (let i = 1; i <= 300; i++) {
    try {
      const response = await axios.get(`https://academy.hackthebox.com/api/v2/modules/${i}`, {
        headers: {
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
        },
      });

      if (response.status === 200) {
        const data = response.data.data;

        const moduleData = {
          id: data.id,
          name: data.name,
          description: data.description,
          difficulty: data.difficulty.title,
          url: data.url.absolute,
          image: data.avatar || data.logo,
        };

        // const relatedMachines = data.related.machines;
        // const machineIds = new Set(relatedMachines.map((machine) => machine.id));
        // const machineIdArray = Array.from(machineIds);

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

          console.log(`Module ${i} (${data.name}) inserted successfully`);
        } catch (dbError) {
          console.error(`Database error for module ${i}:`, dbError.message);
        } finally {
          client.release();
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Module ${i} not found - skipping`);
      } else {
        console.log(`Error fetching module ${i}:`, error.message);
      }
    }

    // console.log(`Waiting ${DELAY_BETWEEN_REQUESTS / 1000} seconds before next request...`);
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
}

async function main() {
  await populateModuleTable();
}

main();
