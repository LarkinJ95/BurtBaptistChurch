const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "blockquote", "a"]);

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function sanitizeRichText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(trimmed)) return trimmed.split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("");
  return trimmed.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, rawName: string, attributes: string) => {
    const name = rawName.toLowerCase();
    if (!allowedTags.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name !== "a") return `<${name}>`;
    const href = attributes.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    return /^(https?:|mailto:|\/)/i.test(href) ? `<a href="${escapeHtml(href)}" rel="noreferrer">` : "<a>";
  });
}

export function richTextToPlainText(value: string) {
  return sanitizeRichText(value).replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
