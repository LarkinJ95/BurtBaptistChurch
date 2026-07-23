import Link from "next/link";
import { eq } from "drizzle-orm";
import { getCurrentAdmin } from "../../../auth";
import { ensureContentManagementTables, getDb } from "../../../../db";
import { sermons } from "../../../../db/schema";
import { findLegacySermon, getLegacySermon } from "../../../sermons/legacy";

export const dynamic = "force-dynamic";

export default async function SermonEditor({ params }: { params: Promise<{ slug: string }> }) {
  const email = await getCurrentAdmin();
  if (!email) return <main className="admin-shell"><section className="login-card"><h1>Staff sign-in required.</h1><Link href="/admin">Go to sign in</Link></section></main>;
  const { slug } = await params;
  const isNew = slug === "new";
  const legacy = isNew ? null : findLegacySermon(slug);
  if (!isNew && !legacy) return <main className="admin-shell"><section className="login-card"><h1>Message not found.</h1><Link href="/admin/sermons">Back to library</Link></section></main>;
  let override: typeof sermons.$inferSelect | undefined;
  try { await ensureContentManagementTables(); if (legacy) override = await getDb().select().from(sermons).where(eq(sermons.legacyUrl, legacy.url)).get(); } catch { /* The form can still prepare an archive edit while D1 initializes. */ }
  const legacyDetails = legacy ? await getLegacySermon(slug) : null;
  const title = override?.title ?? legacy?.title ?? "";
  const speaker = override?.speaker ?? legacy?.speaker ?? "Burt Baptist Church";
  const sermonDate = override?.sermonDate ?? legacy?.date ?? "";
  const outline = override?.outline ?? legacyDetails?.outline.join("\n\n") ?? "";
  return <main className="admin-shell"><header className="admin-header"><Link className="admin-brand" href="/admin/sermons">← All sermons</Link><span>Signed in as {email}</span></header><section className="admin-intro"><p className="eyebrow">Sermon editor</p><h1>{isNew ? <>Add a new<br /><i>message.</i></> : <>Edit this<br /><i>message.</i></>}</h1><p>{isNew ? "Publish a new sermon directly to the church library." : "Your changes will be served by this app instead of relying on the former website."}</p></section><form className="admin-card sermon-editor" action="/api/admin/sermons" method="post" encType="multipart/form-data">{override && <input type="hidden" name="id" value={override.id} />}{legacy && <input type="hidden" name="legacyUrl" value={legacy.url} />}<label>Message title<input name="title" required defaultValue={title} /></label><label>Speaker<input name="speaker" required defaultValue={speaker} /></label><label>Service date<input name="sermonDate" required defaultValue={sermonDate} /></label><label>Description<textarea name="description" defaultValue={override?.description ?? ""} placeholder="A short summary for listeners" /></label><label>Outline text<textarea name="outline" defaultValue={outline} placeholder="Paste the sermon outline here. Separate paragraphs with a blank line." /></label><label>Replace or add audio<input name="audio" type="file" accept="audio/*" /></label><label>Replace or add outline PDF<input name="pdf" type="file" accept="application/pdf,.pdf" /></label><label>Video or message link<input name="mediaUrl" type="url" defaultValue={override?.mediaUrl ?? ""} placeholder="https://..." /></label><p className="admin-help">{legacy ? "If you leave media blank, the original archived audio remains available. New uploaded files are hosted in this app." : "Add an audio file or a message link to publish this sermon."}</p><button className="button button-dark">Save sermon <span>→</span></button></form></main>;
}
