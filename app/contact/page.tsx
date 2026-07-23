import Link from "next/link";
import { getPageEntry } from "../../db/content";

export const metadata = { title: "Contact | Burt Baptist Church" };

export default async function ContactPage() {
  const contact = await getPageEntry("contact");
  return <main className="inner-page"><header className="inner-header"><Link className="brand logo-only" href="/" aria-label="Burt Baptist Church home"><img src="/burt-baptist-logo.png" alt="Burt Baptist Church" /></Link><nav><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/sermons">Sermons</Link><Link href="/contact">Contact</Link></nav></header><section className="page-hero"><p className="eyebrow light">{contact?.eyebrow ?? "Find us"}</p><h1>{contact?.title ?? "Come see us this Sunday."}</h1></section><section className="contact-grid"><div className="map-card"><iframe title="Map to Burt Baptist Church" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.776004962567!2d-83.93883078461174!3d43.23515577913785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8823bdf748af87c5%3A0xa90b9a247118d940!2sBurt%20Baptist%20Church!5e0!3m2!1sen!2sus!4v1589157349195!5m2!1sen!2sus" loading="lazy" /></div><div className="contact-card"><p className="eyebrow">Our location</p><h2>Burt Baptist<br />Church</h2><p>{contact?.body ?? "1200 W Burt Rd, Montrose, MI 48457. Have a question before you visit? Give us a call and we will be happy to help."}</p><p><a href="tel:+19897704259">(989) 770-4259</a></p><hr /><a className="button button-dark" href="https://maps.google.com/?q=1200+W+Burt+Rd+Montrose+MI+48457" target="_blank" rel="noreferrer">Get directions <span>↗</span></a></div></section></main>;
}
