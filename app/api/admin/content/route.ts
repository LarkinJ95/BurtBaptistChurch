import { getDb, ensureContentManagementTables } from "../../../../db";
import { contentEntries, siteContent } from "../../../../db/schema";
import { requireAdmin } from "../_auth";

const safeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await ensureContentManagementTables();
    const form = await request.formData();
    const kind = String(form.get("kind") || "welcome");
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!title || !body) return new Response("A title and content are required", { status: 400 });

    if (kind === "welcome") {
      await getDb().insert(siteContent).values({ key: "sunday-welcome", title, body, updatedAt: new Date() }).onConflictDoUpdate({ target: siteContent.key, set: { title, body, updatedAt: new Date() } });
    } else {
      const type = kind === "post" ? "post" : "page";
      const requestedSlug = String(form.get("slug") || "");
      const slug = safeSlug(requestedSlug || title);
      const eyebrow = String(form.get("eyebrow") || "").trim();
      if (!slug) return new Response("A page or post name is required", { status: 400 });
      await getDb().insert(contentEntries).values({ type, slug, eyebrow: eyebrow || null, title, body, updatedAt: new Date() }).onConflictDoUpdate({ target: contentEntries.slug, set: { type, eyebrow: eyebrow || null, title, body, updatedAt: new Date() } });
    }
    return Response.redirect(new URL("/admin?updated=content", request.url), 303);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to save content", { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 });
  }
}
