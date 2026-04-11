/**
 * Loads Google tag (gtag.js) for GA4 when `VITE_GA_MEASUREMENT_ID` is set (e.g. G-XXXXXXXXXX).
 * No scripts run if the env var is empty — safe for local dev without analytics.
 */
export function initGoogleTag(): void {
  const id = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
  if (!id || typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}
