import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function ensureStaffUsersTable() {
  if (!env.DB) {
    throw new Error("D1 binding `DB` is unavailable");
  }
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id integer PRIMARY KEY NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at integer NOT NULL
    )
  `).run();
}
