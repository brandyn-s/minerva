import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./features/workspaces/schema.ts", "./features/exploration/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
