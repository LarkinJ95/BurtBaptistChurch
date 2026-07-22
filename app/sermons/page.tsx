import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "../../db";
import { sermons } from "../../db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sermons | Burt Baptist Church" };

const featured = [{ title: "It Just Keeps Getting Better!", date: "June 7, 2026" }, { title: "A Victorious Christian Life!", date: "June 7, 2026" }, { title: "How Long, Lord?", date: "May 31, 2026" }];

export default async function SermonsPage() {
  let uploaded: typeof sermons.$inferSelect[] = [];
  try { uploaded = await getDb().select().from(sermons).orderBy(desc(sermons.sermonDate)).limit(50); } catch { /* The archive remains available before its first upload. */ }
  const messages = uploaded.length ? uploaded : featured.map((item, index) => ({ id: index, title: item.title, sermonDate: item.date, speaker: "Burt Baptist Church", description: null, mediaUrl: null, audioKey: null, createdAt: new Date() }));
  return <main className="inner-page"><header className="inner-header"><Link className="brand logo-only" href="/" aria-label="Burt Baptist Church home"><img src="/burt-baptist-logo.png" alt="Burt Baptist Church" /></Link><nav><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/sermons">Sermons</Link><Link href="/contact">Contact</Link></nav></header><section className="page-hero"><p className="eyebrow light">Listen anytime</p><h1>Messages of<br /><i>hope and truth.</i></h1></section><section className="archive"><div className="archive-heading"><div><p className="eyebrow">Sermon archive</p><h2>Recent messages</h2></div><p>Listen to a recent message or come worship with us in person this Sunday.</p></div><div className="archive-list">{messages.map((message) => <article key={message.id} className="archive-item"><div className="archive-play">▶</div><div><p className="sermon-meta">{message.sermonDate} <span>·</span> {message.speaker}</p><h3>{message.title}</h3>{message.description && <p>{message.description}</p>}</div>{message.mediaUrl ? <a className="text-link" href={message.mediaUrl} target="_blank" rel="noreferrer">Watch message <span>↗</span></a> : message.audioKey ? <a className="text-link" href={`/api/sermons/${message.id}/audio`}>Listen now <span>→</span></a> : <span className="archive-coming">Audio coming soon</span>}</article>)}</div></section></main>;
}
