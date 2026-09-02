/**
 * Cleaning up links before they are stored or shown.
 *
 * Models with web search attached like to return citations rather than plain
 * URLs - "([penn.edu](https://penn.edu/page?utm_source=openai))" instead of
 * "https://penn.edu/page". Asking them not to helps but does not hold, so
 * every link is normalized on the way in and nothing here can throw on the
 * way out.
 */

/** A link we can actually store, or null if there is nothing usable in it. */
export function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  // "([label](https://real.url))" or "[label](https://real.url)"
  const markdown = value.match(/\[[^\]]*\]\(([^)\s]+)/);
  if (markdown) value = markdown[1];

  // Leftover wrapping punctuation from citation formats.
  value = value.replace(/^[([<\s]+/, "").replace(/[)\]>.,;\s]+$/, "");
  if (!value) return null;

  // Bare domains are common and easy to rescue.
  if (!/^https?:\/\//i.test(value)) {
    if (!/^[\w-]+(\.[\w-]+)+/.test(value)) return null;
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Tracking noise the search tool appends. Not ours, not useful.
    url.searchParams.delete("utm_source");
    return url.toString();
  } catch {
    return null;
  }
}

/** Normalizes a list, dropping anything unusable and any duplicates. */
export function normalizeUrls(raw: string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const url = normalizeUrl(item);
    if (url) seen.add(url);
  }
  return [...seen];
}

/** "https://groups.wharton.upenn.edu/WITG" -> "groups.wharton.upenn.edu". Never throws. */
export function hostnameOf(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").split("/")[0] || raw;
  }
}
