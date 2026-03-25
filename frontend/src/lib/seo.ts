const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "were",
  "with",
]);

const TRACKING_QUERY_KEYS = new Set([
  "ref",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
]);

function normalizeWords(input: string): string[] {
  return String(input || "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function createSeoSlug(input: string, maxWords = 6): string {
  const words = normalizeWords(input);
  const withoutStopWords = words.filter((word) => !STOP_WORDS.has(word));
  const selected = (withoutStopWords.length ? withoutStopWords : words).slice(0, Math.max(3, maxWords));
  return encodeURIComponent(selected.join("-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
}

export function buildNewsPath(title: string, id: string | number): string {
  return `/news/${createSeoSlug(title)}/${id}`;
}

export function removeTrackingParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of TRACKING_QUERY_KEYS) {
    next.delete(key);
  }
  return next;
}

export function buildCanonicalUrl(pathname: string, params: URLSearchParams): string {
  const cleanParams = removeTrackingParams(params);
  const allowedParams = new URLSearchParams();

  // Keep meaningful query params used for real page variants.
  if (pathname === "/news" && cleanParams.get("category")) {
    allowedParams.set("category", cleanParams.get("category") as string);
  }
  if (pathname === "/blog" && cleanParams.get("page")) {
    allowedParams.set("page", cleanParams.get("page") as string);
  }
  if (pathname === "/blog" && cleanParams.get("category")) {
    allowedParams.set("category", cleanParams.get("category") as string);
  }

  const query = allowedParams.toString();
  return `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
}

