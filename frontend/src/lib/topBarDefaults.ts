/** Default partner links (Top bar + Site settings fallback). Keep in sync with `backend/index.js` `DEFAULT_PARTNER_TOP_BAR_LINKS`. */
export const DEFAULT_TOP_BAR_LINKS = [
  { label: "Michampsindia", url: "https://michampsindia.com/" },
  { label: "Highereducationplus", url: "https://highereducationplus.com/" },
  { label: "Asli Prep", url: "https://www.asliprep.com/" },
  { label: "EttechX", url: "https://www.ettechx.com/" },
] as const;

export type TopBarLink = { label: string; url: string };

/**
 * If the API only has 1–3 links (partial save / old data), pad with defaults so all four partners show.
 * If there are 4+ valid links, those are used (first 24 max).
 */
export function normalizeTopBarLinks(raw: { label?: string; url?: string }[] | undefined | null): TopBarLink[] {
  const valid: TopBarLink[] = Array.isArray(raw)
    ? raw
        .map((l) => ({
          label: String(l?.label ?? "").trim(),
          url: String(l?.url ?? "").trim(),
        }))
        .filter((l) => l.label && l.url)
    : [];
  if (valid.length === 0) return DEFAULT_TOP_BAR_LINKS.map((l) => ({ ...l }));
  if (valid.length >= 4) return valid.slice(0, 24);
  return DEFAULT_TOP_BAR_LINKS.map((d, i) =>
    valid[i] ? { label: valid[i].label, url: valid[i].url } : { label: d.label, url: d.url },
  );
}
