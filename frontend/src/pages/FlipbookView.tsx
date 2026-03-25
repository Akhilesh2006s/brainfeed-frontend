import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FlipbookStage, type FlipbookStageHandle } from "@/components/FlipbookStage";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { buildApiUrl } from "@/lib/apiUrl";

type FlipbookMeta = {
  title: string;
  slug: string;
  pdfUrl: string;
};

const FlipbookView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<FlipbookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipbookStageHandle>(null);

  const handlePageChange = useCallback((pageIndex: number, total: number) => {
    setCurrentPage(pageIndex + 1);
    setTotalPages(total);
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    fetch(buildApiUrl(`/flipbooks/slug/${encodeURIComponent(slug)}`))
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((j) => {
        setData(j);
        setError(false);
        setCurrentPage(1);
        setTotalPages(0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share && data) {
        await navigator.share({ title: data.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not share.");
    }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <main className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data || !data.pdfUrl) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <main className="container py-16">
          <h1 className="font-serif text-2xl text-foreground">Flipbook not found</h1>
          <p className="text-muted-foreground mt-2">This issue may have been removed or is not published.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container max-w-6xl py-4 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground leading-snug px-1">
            {data.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 hidden sm:block">
            Use arrow keys or the controls to turn pages.
          </p>
          <p className="text-xs text-muted-foreground mt-2 sm:hidden">Swipe or tap the controls to turn pages.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-0.5 sm:gap-1 h-9 px-2.5 sm:px-3"
            onClick={() => bookRef.current?.flipPrev()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Prev</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-0.5 sm:gap-1 h-9 px-2.5 sm:px-3"
            onClick={() => bookRef.current?.flipNext()}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setZoom((z) => Math.min(1.75, z + 0.15))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-9 px-2.5 sm:px-3"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Full screen</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1 h-9 px-2.5 sm:px-3" onClick={share}>
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <div
            className="h-9 px-3 inline-flex items-center rounded-md border border-border/60 bg-muted/30 text-xs sm:text-sm font-medium text-foreground"
            aria-live="polite"
          >
            Page {currentPage}
            {totalPages > 0 ? ` of ${totalPages}` : ""}
          </div>
        </div>

        <div
          ref={wrapRef}
          className="rounded-xl border border-border/60 bg-muted/20 p-2 sm:p-4 md:p-8 overflow-auto min-h-[40vh] sm:min-h-[50vh] -mx-1 sm:mx-0"
        >
          <div
            className="flex w-full min-w-0 justify-center origin-top will-change-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <FlipbookStage
              ref={bookRef}
              pdfUrl={data.pdfUrl}
              title={data.title}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FlipbookView;
