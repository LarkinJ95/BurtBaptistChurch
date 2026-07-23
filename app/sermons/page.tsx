import Link from "next/link";
import { desc } from "drizzle-orm";
import { ensureContentManagementTables, getDb } from "../../db";
import { sermons } from "../../db/schema";
import liveSermons from "./live-sermons.json";
import { legacySlug } from "./legacy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sermons | Burt Baptist Church" };

const PAGE_SIZE = 10;
type DisplayMessage = { id: string | number; title: string; sermonDate: string; speaker: string; description: string | null; mediaUrl: string | null; audioKey: string | null; liveUrl?: string };

export default async function SermonsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  let uploaded: typeof sermons.$inferSelect[] = [];
  try { await ensureContentManagementTables(); uploaded = await getDb().select().from(sermons).orderBy(desc(sermons.sermonDate)); } catch { /* The archive remains available before its first upload. */ }
  const legacyOverrides = new Map(uploaded.filter((message) => message.legacyUrl).map((message) => [message.legacyUrl!, message]));
  const originalMessages = uploaded.filter((message) => !message.legacyUrl);
  const messages: DisplayMessage[] = [...originalMessages.map((message) => ({ ...message })), ...liveSermons.map((message) => {
    const override = legacyOverrides.get(message.url);
    return { id: `live-${message.url}`, title: override?.title ?? message.title, sermonDate: override?.sermonDate ?? message.date, speaker: override?.speaker ?? message.speaker, description: override?.description ?? null, mediaUrl: override?.mediaUrl ?? null, audioKey: override?.audioKey ?? null, liveUrl: legacySlug(message.url) };
  })];
  const { page: pageInput } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(pageInput ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const pageMessages = messages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageHref = (page: number) => page === 1 ? "/sermons" : `/sermons?page=${page}`;

  return <main className="inner-page"><header className="inner-header"><Link className="brand logo-only" href="/" aria-label="Burt Baptist Church home"><img src="/burt-baptist-logo.png" alt="Burt Baptist Church" /></Link><nav><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/sermons">Sermons</Link><Link href="/contact">Contact</Link></nav></header><section className="page-hero"><p className="eyebrow light">Listen anytime</p><h1>Messages of<br /><i>hope and truth.</i></h1></section><section className="archive"><div className="archive-heading"><div><p className="eyebrow">Sermon archive</p><h2>Recent messages</h2></div><p>Browse {messages.length} Burt Baptist sermons, ten messages at a time.</p></div><div className="archive-list">{pageMessages.map((message) => <article key={message.id} className="archive-item"><div className="archive-play">▶</div><div><p className="sermon-meta">{message.sermonDate} <span>·</span> {message.speaker}</p><h3>{message.title}</h3>{message.description && <p>{message.description}</p>}</div><Link className="text-link" href={`/sermons/${message.liveUrl ?? message.id}`}>Open sermon <span>→</span></Link></article>)}</div>{totalPages > 1 && <nav className="archive-pagination" aria-label="Sermon archive pages"><span>Page {currentPage} of {totalPages}</span><div>{currentPage > 1 && <Link href={pageHref(currentPage - 1)}>← Newer</Link>}{currentPage < totalPages && <Link href={pageHref(currentPage + 1)}>Older →</Link>}</div></nav>}</section></main>;
}
