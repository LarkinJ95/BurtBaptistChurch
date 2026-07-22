import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { sermons } from "../../../../../db/schema";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const sermon = await getDb().select().from(sermons).where(eq(sermons.id, Number(id))).get();
  if (!sermon?.audioKey) return new Response("Sermon audio not found", { status: 404 });
  const audio = await env.SERMONS.get(sermon.audioKey);
  if (!audio) return new Response("Sermon audio not found", { status: 404 });
  return new Response(audio.body, { headers: { "content-type": audio.httpMetadata?.contentType || "audio/mpeg", "content-disposition": `inline; filename="${sermon.title.replace(/[^a-z0-9]/gi, "-")}.mp3"` } });
}
