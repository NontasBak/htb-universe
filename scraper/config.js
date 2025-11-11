import "dotenv/config";
import { Pool } from "pg";

const dbConfig = {
  host: "localhost",
  user: process.env.ROLE_NAME,
  database: "htb_universe",
  password: process.env.ROLE_PASSWORD,
  port: 5432,
};

const pool = new Pool(dbConfig);

export { dbConfig, pool };
