import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { buildApiUrl } from "@/lib/apiUrl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Images, Maximize2 } from "lucide-react";

export type GalleryItemPublic = {
  id: string;
  kind: "image" | "youtube";
  imageUrl?: string;
  youtubeVideoId?: string;
  embedUrl?: string;
  title?: string;
  caption?: string;
};

const Gallery = () => {
  const [items, setItems] = useState<GalleryItemPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const closePreview = useCallback(() => setPreviewIndex(null), []);

  const goPrev = useCallback(() => {
    setPreviewIndex((i) => {
      if (i === null || items.length < 2) return i;
      return (i - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const goNext = useCallback(() => {
    setPreviewIndex((i) => {
      if (i === null || items.length < 2) return i;
      return (i + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, goPrev, goNext]);

  const previewItem = previewIndex !== null ? items[previewIndex] : null;

  useEffect(() => {
    const t = document.title;
    document.title = "Gallery | Brainfeed Magazine";
    return () => {
      document.title = t;
    };
  }, []);

  useEffect(() => {
    fetch(buildApiUrl("/gallery"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container py-10 md:py-14">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <Images className="h-8 w-8 text-accent" aria-hidden />
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">Gallery</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mb-10">
            Photos and videos from Brainfeed Magazine — events, classrooms, and highlights from the education community.
          </p>
        </ScrollReveal>

        {loading ? (
          <p className="text-muted-foreground">Loading gallery…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center rounded-xl border border-border/60 bg-card/40">
            Gallery items will appear here once they are added in the admin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((item, index) => (
              <ScrollReveal key={item.id}>
                <article className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {item.kind === "youtube" && item.embedUrl ? (
                    <div className="relative aspect-video bg-muted w-full group">
                      <iframe
                        title={item.title || "YouTube video"}
                        src={item.embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-md border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                        Preview
                      </button>
                    </div>
                  ) : item.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className="block w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-2xl"
                    >
                      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title || "Gallery image"}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </div>
                      <span className="sr-only">Open larger preview</span>
                    </button>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      No preview
                    </div>
                  )}
                  {(item.title || item.caption) && (
                    <div className="p-4 space-y-1">
                      {item.title && (
                        <h2 className="font-serif text-lg text-foreground leading-snug">{item.title}</h2>
                      )}
                      {item.caption && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.caption}</p>
                      )}
                    </div>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}

        <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-[min(96vw,1200px)] w-full max-h-[92vh] overflow-y-auto p-0 gap-0 border border-border/50 bg-background/98 shadow-2xl sm:rounded-xl">
            {previewItem && (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>{previewItem.title || "Gallery preview"}</DialogTitle>
                  <DialogDescription>
                    {previewItem.caption || "Enlarged gallery image or video."}
                  </DialogDescription>
                </DialogHeader>
                {previewItem.kind === "youtube" && previewItem.embedUrl ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      title={previewItem.title || "YouTube video"}
                      src={previewItem.embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : previewItem.imageUrl ? (
                  <div className="flex max-h-[min(78vh,900px)] w-full items-center justify-center bg-muted/30 p-2 sm:p-4">
                    <img
                      src={previewItem.imageUrl}
                      alt={previewItem.title || "Gallery image"}
                      className="max-h-[min(78vh,900px)] w-full object-contain"
                    />
                  </div>
                ) : null}
                {(previewItem.title || previewItem.caption) && (
                  <div className="px-5 pb-5 pt-3 border-t border-border/40 space-y-1">
                    {previewItem.title && (
                      <p className="font-serif text-lg text-foreground pr-8">{previewItem.title}</p>
                    )}
                    {previewItem.caption && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{previewItem.caption}</p>
                    )}
                  </div>
                )}
                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      className="absolute left-2 top-1/2 z-[60] -translate-y-1/2 rounded-full bg-background/90 p-2.5 text-foreground shadow-lg border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      className="absolute right-2 top-1/2 z-[60] -translate-y-1/2 rounded-full bg-background/90 p-2.5 text-foreground shadow-lg border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Next item"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
