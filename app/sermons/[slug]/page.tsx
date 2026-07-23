import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sermons } from "../../../db/schema";
import { getLegacySermon } from "../legacy";

export const dynamic = "force-dynamic";

export default async function SermonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const numericId = Number(slug);
  if (Number.isInteger(numericId) && numericId > 0) {
    const result = await getDb().select().from(sermons).where(eq(sermons.id, numericId)).limit(1);
    const sermon = result[0];
    if (!sermon) return <main className="inner-page"><section className="archive"><h1>Message not found</h1><Link href="/sermons">Back to sermons</Link></section></main>;
    return <SermonView title={sermon.title} date={sermon.sermonDate} speaker={sermon.speaker} description={sermon.description} outline={sermon.outline?.split(/\n\s*\n/).filter(Boolean) ?? []} audioUrl={sermon.audioKey ? `/api/sermons/${sermon.id}/audio` : sermon.mediaUrl} pdfUrl={sermon.pdfKey ? `/api/sermons/${sermon.id}/pdf` : null} />;
  }
  const sermon = await getLegacySermon(slug);
  if (!sermon) return <main className="inner-page"><section className="archive"><h1>Message not found</h1><Link href="/sermons">Back to sermons</Link></section></main>;
  return <SermonView title={sermon.title} date={sermon.date} speaker={sermon.speaker} description={null} outline={sermon.outline} audioUrl={sermon.audioUrl ? `/api/legacy-sermons/${sermon.slug}/audio` : null} pdfUrl={sermon.pdfUrl ? `/api/legacy-sermons/${sermon.slug}/pdf` : null} />;
}

function SermonView({ title, date, speaker, description, outline, audioUrl, pdfUrl }: { title: string; date: string; speaker: string; description: string | null; outline: string[]; audioUrl: string | null; pdfUrl: string | null }) {
  return <main className="inner-page"><header className="inner-header"><Link className="brand logo-only" href="/" aria-label="Burt Baptist Church home"><img src="/burt-baptist-logo.png" alt="Burt Baptist Church" /></Link><nav><Link href="/">Home</Link><Link href="/sermons">Sermons</Link><Link href="/contact">Contact</Link></nav></header><section className="sermon-detail"><Link className="back-link" href="/sermons">← All sermons</Link><p className="eyebrow">{date} · {speaker}</p><h1>{title}</h1>{description && <p className="sermon-description">{description}</p>}{audioUrl && <audio className="sermon-audio" controls preload="metadata" src={audioUrl}>Your browser does not support audio playback.</audio>}<div className="sermon-actions">{audioUrl && <a className="button button-dark" href={audioUrl}>Listen or download <span>→</span></a>}{pdfUrl && <a className="button button-gold" href={pdfUrl} target="_blank" rel="noreferrer">Open outline PDF <span>↗</span></a>}</div><section className="sermon-outline"><p className="eyebrow">Sermon outline</p>{outline.length ? outline.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>The sermon outline will be available soon.</p>}</section></section></main>;
}
