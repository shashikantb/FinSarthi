
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// This check can remain, as it's only for the drizzle-kit CLI tool.
// It's not part of the main application bundle.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
