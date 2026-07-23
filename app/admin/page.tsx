import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getCurrentAdmin } from "../auth";
import { ensureContentManagementTables, getDb } from "../../db";
import { contentEntries, sermons } from "../../db/schema";
import liveSermons from "../sermons/live-sermons.json";
import { legacySlug } from "../sermons/legacy";

export const dynamic = "force-dynamic";

const editablePages = [
  { slug: "home", eyebrow: "Welcome to Burt Baptist", title: "Discover a victorious Christian life.", body: "We are a local church family committed to loving God, loving others, and making disciples. Whether you have grown up in church or are just beginning to explore faith, there is a place for you here." },
  { slug: "about", eyebrow: "Our mission", title: "Helping people grow in their relationship with God.", body: "At Burt Baptist Church, we seek to strengthen meaningful relationships in family life and community. Join us each Sunday to experience the warmth of faith and the strength of our church family." },
  { slug: "contact", eyebrow: "Find us", title: "Come see us this Sunday.", body: "1200 W Burt Rd, Montrose, MI 48457. Have a question before you visit? Give us a call and we will be happy to help." },
];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; reason?: string; updated?: string }> }) {
  const email = await getCurrentAdmin();
  const { error, reason, updated } = await searchParams;
  if (!email) return <Login error={error} reason={reason} />;

  let entries: typeof contentEntries.$inferSelect[] = [];
  let uploaded: typeof sermons.$inferSelect[] = [];
  try {
    await ensureContentManagementTables();
    [entries, uploaded] = await Promise.all([
      getDb().select().from(contentEntries).orderBy(desc(contentEntries.updatedAt)),
      getDb().select().from(sermons).orderBy(desc(sermons.sermonDate)),
    ]);
  } catch { /* The portal remains usable after a newly connected D1 database is initialized. */ }
  const pageEntries = new Map(entries.filter((entry) => entry.type === "page").map((entry) => [entry.slug, entry]));
  const posts = entries.filter((entry) => entry.type === "post");
  const overrides = new Map(uploaded.filter((sermon) => sermon.legacyUrl).map((sermon) => [sermon.legacyUrl!, sermon]));
  const archive = (liveSermons as { title: string; date: string; speaker: string; url: string }[]).map((sermon) => ({ ...sermon, override: overrides.get(sermon.url) })).slice(0, 24);

  return <main className="admin-shell">
    <header className="admin-header"><Link className="admin-brand" href="/">← Burt Baptist Church</Link><div className="admin-account"><span>Signed in as {email}</span><form action="/api/auth/logout" method="post"><button type="submit">Sign out</button></form></div></header>
    <section className="admin-intro"><p className="eyebrow">Staff portal</p><h1>Manage every<br /><i>church update.</i></h1><p>Edit published sermons, page copy, and church posts from one place.</p>{updated && <p className="admin-success">Saved successfully.</p>}</section>

    <section className="admin-card admin-library"><div className="admin-card-heading"><div><p className="eyebrow">Sermon library</p><h2>Past and present messages</h2></div><Link className="button button-dark" href="/admin/sermons/new">Add a sermon <span>→</span></Link></div><p className="admin-help">Every historic sermon is editable. Changes create an app-owned version with your revised description, outline, audio, and PDF while preserving the original archive as a fallback.</p><div className="admin-list">{archive.map((sermon) => <article className="admin-list-row" key={sermon.url}><div><p className="sermon-meta">{sermon.override?.sermonDate ?? sermon.date} · {sermon.override?.speaker ?? sermon.speaker}</p><h3>{sermon.override?.title ?? sermon.title}</h3><small>{sermon.override ? "Customized in your library" : "Imported archive"}</small></div><Link href={`/admin/sermons/${legacySlug(sermon.url)}`}>{sermon.override ? "Edit" : "Customize"} →</Link></article>)}</div><Link className="text-link" href="/admin/sermons">Browse all {liveSermons.length} archived sermons <span>→</span></Link></section>

    <section className="admin-card admin-library"><div className="admin-card-heading"><div><p className="eyebrow">Pages</p><h2>Website page copy</h2></div></div><div className="admin-editor-grid">{editablePages.map((fallback) => { const entry = pageEntries.get(fallback.slug); return <form className="admin-editor" action="/api/admin/content" method="post" key={fallback.slug}><input type="hidden" name="kind" value="page" /><input type="hidden" name="slug" value={fallback.slug} /><p className="eyebrow">/{fallback.slug === "home" ? "" : fallback.slug}</p><label>Section label<input name="eyebrow" defaultValue={entry?.eyebrow ?? fallback.eyebrow} /></label><label>Headline<input name="title" required defaultValue={entry?.title ?? fallback.title} /></label><label>Body copy<textarea name="body" required defaultValue={entry?.body ?? fallback.body} /></label><button className="button button-dark">Save {fallback.slug} page <span>→</span></button></form>; })}</div><form className="admin-editor new-page-editor" action="/api/admin/content" method="post"><input type="hidden" name="kind" value="page" /><p className="eyebrow">Additional page</p><label>Page URL<input name="slug" required placeholder="our-staff" /></label><label>Section label<input name="eyebrow" placeholder="Meet the team" /></label><label>Headline<input name="title" required placeholder="Our staff" /></label><label>Body copy<textarea name="body" required placeholder="Write the page content here." /></label><button className="button button-dark">Publish page <span>→</span></button></form></section>

    <section className="admin-grid"><form className="admin-card" action="/api/admin/content" method="post"><input type="hidden" name="kind" value="post" /><p className="eyebrow">Church posts</p><h2>Publish an update</h2><label>Post title<input name="title" required /></label><label>Short label<input name="eyebrow" placeholder="Community news" /></label><label>Post text<textarea name="body" required placeholder="Share an update with your church family." /></label><button className="button button-dark">Publish post <span>→</span></button></form><section className="admin-card"><p className="eyebrow">Published posts</p><h2>Edit updates</h2>{posts.length ? <div className="admin-list">{posts.map((post) => <form action="/api/admin/content" method="post" className="admin-post-form" key={post.id}><input type="hidden" name="kind" value="post" /><input type="hidden" name="slug" value={post.slug} /><label>Label<input name="eyebrow" defaultValue={post.eyebrow ?? ""} /></label><label>Title<input name="title" defaultValue={post.title} required /></label><label>Text<textarea name="body" defaultValue={post.body} required /></label><button className="text-button">Save post</button></form>)}</div> : <p className="admin-help">No posts published yet.</p>}</section></section>
  </main>;
}

function Login({ error, reason }: { error?: string; reason?: string }) {
  return <main className="admin-shell"><Link className="admin-brand" href="/">← Burt Baptist Church</Link><section className="login-card"><p className="eyebrow">Staff portal</p><h1>Welcome back.</h1><p>Sign in to manage sermons, pages, and church updates.</p>{error === "invalid-login" && <p className="login-error">That email or password was not recognized. New staff passwords must be at least 6 characters.</p>}{error === "database" && <p className="login-error">The staff table could not be reached. {reason ? `D1 reported: ${reason}` : "Confirm this Worker is connected to the burtbaptistchurch D1 database."}</p>}{error === "d1-binding" && <p className="login-error">This deployed Worker does not have its D1 database binding. Redeploy the latest main branch.</p>}<form action="/api/auth/login" method="post" className="login-form"><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength={6} autoComplete="current-password" required /></label><button className="button button-dark" type="submit">Sign in <span>→</span></button></form><small>Having trouble? Contact your site administrator.</small></section></main>;
}
