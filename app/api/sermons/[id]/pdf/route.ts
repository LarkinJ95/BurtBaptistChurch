import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { sermons } from "../../../../../db/schema";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sermon = await getDb().select().from(sermons).where(eq(sermons.id, Number(id))).limit(1);
  if (!sermon[0]?.pdfKey) return new Response("PDF not found", { status: 404 });
  const object = await env.SERMONS.get(sermon[0].pdfKey);
  if (!object) return new Response("PDF not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${sermon[0].title.replace(/[^a-z0-9]/gi, "-")}.pdf"` } });
}
