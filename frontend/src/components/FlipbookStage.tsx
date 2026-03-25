import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import HTMLFlipBook from "react-pageflip";
import { Loader2 } from "lucide-react";
import { playPageFlipSound } from "@/lib/pageFlipSound";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MAX_PAGES = 120;
/** Logical page width for PDF rasterization and flipbook (CSS px). */
const TARGET_PAGE_WIDTH = 420;

/** Viewport width for sizing the book (works before the flipbook DOM exists — e.g. while PDF loads). */
function useViewportInnerWidth() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setW(window.innerWidth), 150);
    };
    setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return w;
}

/**
 * Rasterize PDF at higher resolution so text stays sharp on retina / zoom.
 * (Previously we rendered 1 canvas px = 1 CSS px → blurry on HiDPI and when zoomed.)
 */
function getPdfRenderScale(): number {
  if (typeof window === "undefined") return 2;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(3, Math.max(2, dpr));
}

export type FlipbookStageHandle = {
  flipNext: () => void;
  flipPrev: () => void;
};

const FlipPage = forwardRef<HTMLDivElement, { src: string; alt: string }>(({ src, alt }, ref) => (
  <div
    ref={ref}
    className="bg-[#fafafa] flex items-center justify-center border border-border/30 shadow-inner"
    style={{ width: "100%", height: "100%" }}
  >
    <img src={src} alt={alt} className="max-w-full max-h-full object-contain select-none" draggable={false} />
  </div>
));
FlipPage.displayName = "FlipPage";

async function renderPdfPageToDataUrl(
  page: pdfjsLib.PDFPageProxy,
  canvasW: number,
  canvasH: number,
  renderScale: number,
): Promise<string> {
  const base = page.getViewport({ scale: 1 });
  const logicalW = TARGET_PAGE_WIDTH;
  const scale = (logicalW * renderScale) / base.width;
  const vp = page.getViewport({ scale });

  const tmp = document.createElement("canvas");
  tmp.width = Math.ceil(vp.width);
  tmp.height = Math.ceil(vp.height);
  const tctx = tmp.getContext("2d", { alpha: false });
  if (!tctx) return "";
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";

  await page.render({ canvasContext: tctx, viewport: vp }).promise;

  const outW = Math.ceil(canvasW * renderScale);
  const outH = Math.ceil(canvasH * renderScale);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  const x = (outW - vp.width) / 2;
  const y = (outH - vp.height) / 2;
  ctx.drawImage(tmp, x, y);
  /* High JPEG quality + high pixel density keeps type readable; PNG is sharper but very heavy for long PDFs. */
  return canvas.toDataURL("image/jpeg", 0.98);
}

type Props = {
  pdfUrl: string;
  title: string;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
};

export const FlipbookStage = forwardRef<FlipbookStageHandle, Props>(function FlipbookStage(
  { pdfUrl, title, onPageChange },
  ref,
) {
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: TARGET_PAGE_WIDTH, h: 600 });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const bookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } | null } | null>(
    null,
  );
  const onPageChangeRef = useRef<Props["onPageChange"]>(onPageChange);
  /** First `flip` event is from initial layout, not a user turn — skip sound for that. */
  const skipInitialFlipSound = useRef(true);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    skipInitialFlipSound.current = true;
  }, [pdfUrl]);

  const handleFlip = useCallback((e?: unknown) => {
    const eventData = (e as { data?: number } | undefined)?.data;
    if (typeof eventData === "number") {
      onPageChangeRef.current?.(eventData, pageUrls.length);
    }
    if (skipInitialFlipSound.current) {
      skipInitialFlipSound.current = false;
      return;
    }
    void playPageFlipSound();
  }, [pageUrls.length]);

  const vw = useViewportInnerWidth();
  /** Fit one page to screen; cap at TARGET_PAGE_WIDTH so desktop keeps a two-page spread when wide enough. */
  const pageW = Math.min(TARGET_PAGE_WIDTH, Math.max(260, vw - 56));
  const pageH = Math.max(320, Math.round(dims.h * (pageW / TARGET_PAGE_WIDTH)));
  /** Remount StPageFlip when size bucket changes (library does not reliably resize in place). */
  const sizeBucket = Math.round(pageW / 48) * 48;

  useImperativeHandle(ref, () => ({
    flipNext: () => bookRef.current?.pageFlip()?.flipNext(),
    flipPrev: () => bookRef.current?.pageFlip()?.flipPrev(),
  }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPageUrls([]);
    setProgress("Loading PDF…");

    (async () => {
      try {
        const task = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
        const pdf = await task.promise;
        if (cancelled) return;
        const numPages = Math.min(pdf.numPages, MAX_PAGES);
        const heights: number[] = [];
        for (let i = 1; i <= numPages; i++) {
          const p = await pdf.getPage(i);
          const base = p.getViewport({ scale: 1 });
          const sc = TARGET_PAGE_WIDTH / base.width;
          const vp = p.getViewport({ scale: sc });
          heights.push(Math.ceil(vp.height));
        }
        const maxH = Math.max(600, ...heights, 400);
        const canvasW = TARGET_PAGE_WIDTH;
        const canvasH = maxH;
        setDims({ w: canvasW, h: canvasH });

        const renderScale = getPdfRenderScale();

        const urls: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          if (cancelled) return;
          setProgress(`Rendering page ${i} / ${numPages}…`);
          const p = await pdf.getPage(i);
          const dataUrl = await renderPdfPageToDataUrl(p, canvasW, canvasH, renderScale);
          urls.push(dataUrl);
        }
        if (cancelled) return;
        setPageUrls(urls);
        onPageChangeRef.current?.(0, urls.length);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load this PDF.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      bookRef.current?.pageFlip()?.flipNext();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      bookRef.current?.pageFlip()?.flipPrev();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (loading || pageUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm">{progress || "Preparing flipbook…"}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-full min-w-0 justify-center overflow-x-auto py-2 sm:py-4 px-1 sm:px-0 touch-manipulation">
      <HTMLFlipBook
        key={`book-${pdfUrl}-${sizeBucket}-${pageH}`}
        ref={bookRef}
        width={pageW}
        height={pageH}
        size="fixed"
        drawShadow
        showCover
        flippingTime={900}
        className="mx-auto max-w-full"
        style={{ touchAction: "manipulation" }}
        startPage={0}
        usePortrait
        mobileScrollSupport
        swipeDistance={24}
        onFlip={handleFlip}
      >
        {pageUrls.map((src, i) => (
          <FlipPage key={`p-${i}`} src={src} alt={`${title} — page ${i + 1}`} />
        ))}
      </HTMLFlipBook>
    </div>
  );
});
