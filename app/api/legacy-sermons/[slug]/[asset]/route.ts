import { env } from "cloudflare:workers";
import { getLegacySermon } from "../../../../sermons/legacy";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; asset: string }> }) {
  const { slug, asset } = await params;
  if (asset !== "audio" && asset !== "pdf") return new Response("Not found", { status: 404 });
  const sermon = await getLegacySermon(slug);
  const assetUrl = asset === "audio" ? sermon?.audioUrl : sermon?.pdfUrl;
  if (!assetUrl) return new Response("File not found", { status: 404 });
  const cacheKey = `legacy-sermons/${slug}.${asset === "pdf" ? "pdf" : "audio"}`;
  const cached = await env.SERMONS.get(cacheKey);
  if (cached) return new Response(cached.body, { headers: { "content-type": cached.httpMetadata?.contentType ?? (asset === "pdf" ? "application/pdf" : "audio/mpeg"), "cache-control": "public, max-age=31536000, immutable" } });
  const response = await fetch(assetUrl);
  if (!response.ok || !response.body) return new Response("File not found", { status: 404 });
  const contentType = response.headers.get("content-type") ?? (asset === "pdf" ? "application/pdf" : "audio/mpeg");
  const [cacheBody, clientBody] = response.body.tee();
  await env.SERMONS.put(cacheKey, cacheBody, { httpMetadata: { contentType } });
  return new Response(clientBody, { headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" } });
}
