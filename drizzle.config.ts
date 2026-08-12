import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local; dotenv defaults to .env. Load both so `db:push`
// and `db:seed` see the same DATABASE_URL the app does.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
