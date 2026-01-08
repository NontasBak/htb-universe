import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DB_HOST: z.string().default("localhost"),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().default("htb_universe"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
