import { pool } from "./config.js";
import axios from "axios";
import "dotenv/config";

const DELAY_BETWEEN_REQUESTS = 2000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function populateModuleTable() {
  const allMachines = new Set();

  for (let i = 0; i <= 500; i++) {
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

        const relatedMachines = data.related?.machines || [];

        // Add machines to our global set for deduplication
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

  // Process unique machines
  console.log(`Found ${allMachines.size} unique machines to process`);

  for (const machineStr of allMachines) {
    const machine = JSON.parse(machineStr);
    await addMachineToDatabase(machine.id, machine.name, machine.os, machine.difficulty, machine.logo);
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
}

async function addMachineToDatabase(id, name, os, difficulty, logo) {
  try {
    const response = await axios.get(`https://labs.hackthebox.com/api/v4/machine/profile/${name}`, {
      headers: {
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
      },
    });

    if (response.status === 200) {
      console.log(`Machine ${name} fetched successfully`);
      const machineData = response.data.info;
      const machineSynopsis = machineData.synopsis;

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
          machineSynopsis,
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
  } catch (error) {
    console.error(`Error fetching machine ${name}:`, error.message);
    return null;
  }
}

async function main() {
  await populateModuleTable();
}

main();
