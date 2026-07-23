import Link from "next/link";
import { desc } from "drizzle-orm";
import { getCurrentAdmin } from "../../auth";
import { ensureContentManagementTables, getDb } from "../../../db";
import { sermons } from "../../../db/schema";
import liveSermons from "../../sermons/live-sermons.json";
import { legacySlug } from "../../sermons/legacy";

export const dynamic = "force-dynamic";
const pageSize = 25;

export default async function ManageSermons({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const email = await getCurrentAdmin();
  if (!email) return <main className="admin-shell"><section className="login-card"><h1>Staff sign-in required.</h1><Link href="/admin">Go to sign in</Link></section></main>;
  let uploaded: typeof sermons.$inferSelect[] = [];
  try { await ensureContentManagementTables(); uploaded = await getDb().select().from(sermons).orderBy(desc(sermons.sermonDate)); } catch { /* Render the archive even if D1 is freshly initializing. */ }
  const overrides = new Map(uploaded.filter((sermon) => sermon.legacyUrl).map((sermon) => [sermon.legacyUrl!, sermon]));
  const legacy = (liveSermons as { title: string; date: string; speaker: string; url: string }[]).map((sermon) => ({ ...sermon, override: overrides.get(sermon.url) }));
  const { page: rawPage } = await searchParams;
  const pages = Math.max(1, Math.ceil(legacy.length / pageSize));
  const page = Math.min(Math.max(Number(rawPage) || 1, 1), pages);
  const items = legacy.slice((page - 1) * pageSize, page * pageSize);
  return <main className="admin-shell"><header className="admin-header"><Link className="admin-brand" href="/admin">← Staff dashboard</Link><span>Signed in as {email}</span></header><section className="admin-intro"><p className="eyebrow">Sermon library</p><h1>All historic<br /><i>messages.</i></h1><p>Select any sermon to revise its title, outline, audio, PDF, or details.</p></section><section className="admin-card admin-library"><div className="admin-list">{items.map((sermon) => <article className="admin-list-row" key={sermon.url}><div><p className="sermon-meta">{sermon.override?.sermonDate ?? sermon.date} · {sermon.override?.speaker ?? sermon.speaker}</p><h3>{sermon.override?.title ?? sermon.title}</h3><small>{sermon.override ? "Customized" : "Original archive"}</small></div><Link href={`/admin/sermons/${legacySlug(sermon.url)}`}>Edit →</Link></article>)}</div><nav className="archive-pagination" aria-label="Archive editor pages"><span>Page {page} of {pages}</span><div>{page > 1 && <Link href={`/admin/sermons?page=${page - 1}`}>← Newer</Link>}{page < pages && <Link href={`/admin/sermons?page=${page + 1}`}>Older →</Link>}</div></nav></section></main>;
}
