/**
 * Build a full API URL for fetch() from a path like `/admin/posts` or `/posts/news`.
 * - If `VITE_API_URL` is empty, returns a **relative** `/api/...` URL (Vite dev proxy → backend).
 * - If base ends with `/api`, avoids doubling the prefix.
 */
export function buildApiUrl(path: string): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";
  const base = raw.replace(/\/+$/, "");
  const segment = path.startsWith("/") ? path : `/${path}`;
  const apiPath = segment.startsWith("/api") ? segment : `/api${segment}`;

  if (!base) return apiPath;

  if (base.endsWith("/api")) {
    return `${base}${apiPath.replace(/^\/api/, "") || "/"}`;
  }
  return `${base}${apiPath}`;
}
