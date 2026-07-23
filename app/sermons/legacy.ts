import liveSermons from "./live-sermons.json";

type LegacySummary = { title: string; date: string; speaker: string; url: string };
export type LegacySermon = LegacySummary & { slug: string; audioUrl: string | null; pdfUrl: string | null; outline: string[] };

export const legacySlug = (url: string) => new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
export const findLegacySermon = (slug: string) => (liveSermons as LegacySummary[]).find((sermon) => legacySlug(sermon.url) === slug);

const decodeHtml = (value: string) => value.replaceAll("&nbsp;", " ").replaceAll("&#8217;", "’").replaceAll("&#8216;", "‘").replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&#038;", "&").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
const cleanText = (html: string) => decodeHtml(html.replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]*>/g, "")).replace(/[ \t]+\n/g, "\n").trim();

export async function getLegacySermon(slug: string): Promise<LegacySermon | null> {
  const sermon = findLegacySermon(slug);
  if (!sermon) return null;
  const response = await fetch(sermon.url);
  if (!response.ok) return { ...sermon, slug, audioUrl: null, pdfUrl: null, outline: [] };
  const html = await response.text();
  const audioUrl = html.match(/<audio[^>]+src=["']([^"']+)["']/i)?.[1] ?? html.match(/href=["']([^"']+\.(?:mp3|m4a|wav))["'][^>]*class=["'][^"']*play-audio-link/i)?.[1] ?? null;
  const pdfUrl = html.match(/href=["']([^"']+\.pdf)["'][^>]*class=["'][^"']*download-pdf-link/i)?.[1] ?? null;
  const outlineHtml = html.match(/<div class=["']page-content["']>([\s\S]*?)<\/div>\s*<div class=["']share-bar/i)?.[1] ?? "";
  return { ...sermon, slug, audioUrl: audioUrl ? decodeHtml(audioUrl) : null, pdfUrl: pdfUrl ? decodeHtml(pdfUrl) : null, outline: cleanText(outlineHtml).split(/\n\s*\n/).filter(Boolean) };
}
