import { getLegacySermon } from "../../../../sermons/legacy";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; asset: string }> }) {
  const { slug, asset } = await params;
  if (asset !== "audio" && asset !== "pdf") return new Response("Not found", { status: 404 });
  const sermon = await getLegacySermon(slug);
  const assetUrl = asset === "audio" ? sermon?.audioUrl : sermon?.pdfUrl;
  if (!assetUrl) return new Response("File not found", { status: 404 });
  const response = await fetch(assetUrl);
  if (!response.ok || !response.body) return new Response("File not found", { status: 404 });
  return new Response(response.body, { headers: { "content-type": response.headers.get("content-type") ?? (asset === "pdf" ? "application/pdf" : "audio/mpeg"), "cache-control": "public, max-age=86400" } });
}
