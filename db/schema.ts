import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", { id: integer("id").primaryKey(), key: text("key").notNull().unique(), title: text("title").notNull(), body: text("body").notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull() });
export const sermons = sqliteTable("sermons", { id: integer("id").primaryKey(), title: text("title").notNull(), speaker: text("speaker").notNull(), sermonDate: text("sermon_date").notNull(), description: text("description"), mediaUrl: text("media_url"), audioKey: text("audio_key"), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
