import Link from "next/link";
import { getPageEntry } from "../../db/content";

export const dynamic = "force-dynamic";

export default async function ManagedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageEntry(slug);
  if (!page || page.type !== "page") return <main className="inner-page"><section className="archive"><h1>Page not found</h1><Link href="/">Return home</Link></section></main>;
  return <main className="inner-page"><header className="inner-header"><Link className="brand logo-only" href="/" aria-label="Burt Baptist Church home"><img src="/burt-baptist-logo.png" alt="Burt Baptist Church" /></Link><nav><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/sermons">Sermons</Link><Link href="/contact">Contact</Link></nav></header><section className="page-hero"><p className="eyebrow light">{page.eyebrow ?? "Burt Baptist Church"}</p><h1>{page.title}</h1></section><section className="first-visit"><p className="managed-page-body">{page.body}</p><Link className="button button-dark" href="/contact">Contact us <span>→</span></Link></section></main>;
}
