import { eq } from "drizzle-orm";
import { ensureContentManagementTables, getDb } from "./index";
import { contentEntries } from "./schema";

export async function getPageEntry(slug: string) {
  try {
    await ensureContentManagementTables();
    return await getDb().select().from(contentEntries).where(eq(contentEntries.slug, slug)).get();
  } catch {
    return undefined;
  }
}
