/** HTML <font size="1..7"> → approximate px (size 7 is treated as body, not huge). */
const FONT_TAG_PX: Record<string, number> = {
  "1": 10,
  "2": 13,
  "3": 16,
  "4": 18,
  "5": 22,
  "6": 26,
  "7": 16,
};

const MAX_BODY_PX = 32;
const MIN_BODY_PX = 10;

function clampPx(n: number): number {
  if (Number.isNaN(n) || n <= 0) return 16;
  return Math.min(MAX_BODY_PX, Math.max(MIN_BODY_PX, Math.round(n)));
}

function namedSizeToPx(value: string): number | null {
  const v = value.trim().toLowerCase();
  if (v.includes("xxx-large") || v.includes("-webkit-xxx-large")) return 16;
  if (v.includes("xx-large")) return 24;
  if (v.includes("x-large")) return 20;
  if (v === "large") return 18;
  if (v === "medium") return 16;
  if (v === "small") return 13;
  if (v.includes("x-small") || v.includes("xx-small")) return 11;
  return null;
}

/**
 * Normalize editor/public article HTML so leftover &lt;font size="7"&gt; / xxx-large
 * markers never render as giant body text.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let out = html;

  // Empty spacer paragraphs
  out = out.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

  // <font size="N">…</font> → <span data-editor-fs style="font-size:Npx">
  out = out.replace(/<font\b([^>]*)>([\s\S]*?)<\/font>/gi, (_m, attrs: string, inner: string) => {
    const sizeMatch = /\bsize\s*=\s*["']?([1-7])["']?/i.exec(attrs || "");
    const styleMatch = /\bstyle\s*=\s*["']([^"']*)["']/i.exec(attrs || "");
    let px = 16;
    if (sizeMatch) px = FONT_TAG_PX[sizeMatch[1]] ?? 16;
    if (styleMatch) {
      const fs = /font-size\s*:\s*([^;]+)/i.exec(styleMatch[1] || "");
      if (fs) {
        const named = namedSizeToPx(fs[1]);
        if (named != null) px = named;
        else {
          const n = parseFloat(fs[1]);
          if (!Number.isNaN(n)) px = clampPx(n);
        }
      }
    }
    px = clampPx(px);
    return `<span data-editor-fs="${px}" style="font-size: ${px}px">${inner}</span>`;
  });

  // Named / webkit huge font-size on spans → clamped px (+ keep data-editor-fs in sync)
  out = out.replace(/<span\b([^>]*)>/gi, (full, attrs: string) => {
    if (!/font-size\s*:/i.test(attrs) && !/data-editor-fs\s*=/i.test(attrs)) return full;

    let px: number | null = null;
    const styleMatch = /\bstyle\s*=\s*["']([^"']*)["']/i.exec(attrs);
    if (styleMatch) {
      const fs = /font-size\s*:\s*([^;]+)/i.exec(styleMatch[1] || "");
      if (fs) {
        const named = namedSizeToPx(fs[1]);
        if (named != null) px = named;
        else {
          const n = parseFloat(fs[1]);
          if (!Number.isNaN(n)) px = clampPx(n);
        }
      }
    }
    const ds = /\bdata-editor-fs\s*=\s*["']?(\d+(?:\.\d+)?)["']?/i.exec(attrs);
    if (ds) {
      const n = parseFloat(ds[1]);
      if (!Number.isNaN(n)) px = clampPx(n);
    }
    if (px == null) return full;

    px = clampPx(px);
    let nextAttrs = attrs;
    if (styleMatch) {
      const nextStyle = styleMatch[1].replace(/font-size\s*:\s*[^;]+;?/i, "").trim().replace(/;+$/, "");
      const styleValue = `${nextStyle ? `${nextStyle}; ` : ""}font-size: ${px}px`;
      nextAttrs = nextAttrs.replace(/\bstyle\s*=\s*["'][^"']*["']/i, `style="${styleValue}"`);
    } else {
      nextAttrs = `${nextAttrs} style="font-size: ${px}px"`;
    }
    if (/\bdata-editor-fs\s*=/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\bdata-editor-fs\s*=\s*["']?[^"'>\s]+["']?/i, `data-editor-fs="${px}"`);
    } else {
      nextAttrs = `${nextAttrs} data-editor-fs="${px}"`;
    }
    return `<span${nextAttrs}>`;
  });

  return out;
}
