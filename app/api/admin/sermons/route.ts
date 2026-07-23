import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { ensureContentManagementTables, getDb } from "../../../../db";
import { sermons } from "../../../../db/schema";
import { requireAdmin } from "../_auth";

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await ensureContentManagementTables();
    const form = await request.formData();
    const id = Number(form.get("id") || 0);
    const legacyUrl = String(form.get("legacyUrl") || "").trim();
    const title = String(form.get("title") || "").trim();
    const speaker = String(form.get("speaker") || "").trim();
    const sermonDate = String(form.get("sermonDate") || "");
    const description = String(form.get("description") || "").trim();
    const outline = String(form.get("outline") || "").trim();
    const mediaUrl = String(form.get("mediaUrl") || "").trim();
    const audio = form.get("audio");
    const pdf = form.get("pdf");
    if (!title || !speaker || !sermonDate) return new Response("Title, speaker, and date are required", { status: 400 });

    const db = getDb();
    const existing = id > 0
      ? await db.select().from(sermons).where(eq(sermons.id, id)).get()
      : legacyUrl ? await db.select().from(sermons).where(eq(sermons.legacyUrl, legacyUrl)).get() : undefined;
    if (!existing && !legacyUrl && !mediaUrl && !(audio instanceof File && audio.size)) return new Response("Add an audio file or a message link", { status: 400 });
    let audioKey = existing?.audioKey ?? null;
    let pdfKey = existing?.pdfKey ?? null;
    if (audio instanceof File && audio.size) {
      if (!audio.type.startsWith("audio/") || audio.size > 250 * 1024 * 1024) return new Response("Please upload an audio file smaller than 250 MB", { status: 400 });
      audioKey = `sermons/${crypto.randomUUID()}-${safeName(audio.name)}`;
      await env.SERMONS.put(audioKey, audio.stream(), { httpMetadata: { contentType: audio.type } });
    }
    if (pdf instanceof File && pdf.size) {
      if (pdf.type !== "application/pdf" || pdf.size > 30 * 1024 * 1024) return new Response("Please upload a PDF smaller than 30 MB", { status: 400 });
      pdfKey = `sermon-outlines/${crypto.randomUUID()}-${safeName(pdf.name)}`;
      await env.SERMONS.put(pdfKey, pdf.stream(), { httpMetadata: { contentType: "application/pdf" } });
    }
    const values = { title, speaker, sermonDate, description: description || null, outline: outline || null, mediaUrl: mediaUrl || null, audioKey, pdfKey, legacyUrl: legacyUrl || null };
    if (existing) await db.update(sermons).set(values).where(eq(sermons.id, existing.id));
    else await db.insert(sermons).values({ ...values, createdAt: new Date() });
    return Response.redirect(new URL("/admin?updated=sermon", request.url), 303);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to save sermon", { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 });
  }
}
