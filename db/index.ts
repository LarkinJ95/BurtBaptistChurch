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

export async function ensureContentManagementTables() {
  if (!env.DB) throw new Error("D1 binding `DB` is unavailable");
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS content_entries (
      id integer PRIMARY KEY NOT NULL,
      type text NOT NULL,
      slug text NOT NULL UNIQUE,
      eyebrow text,
      title text NOT NULL,
      body text NOT NULL,
      updated_at integer NOT NULL
    )
  `).run();
  const columns = await env.DB.prepare("PRAGMA table_info(sermons)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "legacy_url")) {
    await env.DB.prepare("ALTER TABLE sermons ADD COLUMN legacy_url text").run();
    await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS sermons_legacy_url_unique ON sermons(legacy_url)").run();
  }
}
