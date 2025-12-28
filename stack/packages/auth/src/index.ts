import { env } from "@my-better-t-app/env/server";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: "", // Invalid configuration
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
