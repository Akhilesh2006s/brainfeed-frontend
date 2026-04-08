import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { BookOpen, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FlipbookListItem = {
  title: string;
  slug: string;
  updatedAt?: string;
  createdAt?: string;
  issueDate?: string;
  coverImageUrl?: string;
};

function sortTime(item: FlipbookListItem): number {
  return new Date(item.issueDate || item.createdAt || item.updatedAt || 0).getTime();
}

function monthKeyFromItem(item: FlipbookListItem): string {
  const t = sortTime(item);
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthHeading(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const EMagazines = () => {
  const [items, setItems] = useState<FlipbookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<FlipbookListItem | null>(null);

  useEffect(() => {
    const t = document.title;
    document.title = "E-Magazines | Brainfeed Magazine";
    return () => {
      document.title = t;
    };
  }, []);

  useEffect(() => {
    fetch(buildApiUrl("/flipbooks"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const byMonth = useMemo(() => {
    const map = new Map<string, FlipbookListItem[]>();
    for (const item of items) {
      const key = monthKeyFromItem(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => sortTime(b) - sortTime(a));
    }
    const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
    return keys.map((key) => ({ key, label: formatMonthHeading(key), items: map.get(key)! }));
  }, [items]);

  const flipbookHref = (slug: string) => `/flipbook/${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container py-10 md:py-14">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-accent" aria-hidden />
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">E-Magazines</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mb-10">
            Browse Brainfeed digital editions by month. Open any issue to read the full flipbook experience.
          </p>
        </ScrollReveal>

        {loading ? (
          <p className="text-muted-foreground">Loading magazines…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center rounded-xl border border-border/60 bg-card/40">
            No e-magazines are published yet. Admins can add PDF flipbooks in the admin panel.
          </p>
        ) : (
          <div className="space-y-12 md:space-y-14">
            {byMonth.map(({ key, label, items: group }) => (
              <section key={key} aria-labelledby={`month-${key}`}>
                <h2 id={`month-${key}`} className="font-serif text-xl md:text-2xl text-foreground mb-6 pb-2 border-b border-border/60">
                  {label}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {group.map((item) => (
                    <li key={item.slug}>
                      <ScrollReveal>
                        <article className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md hover:border-accent/30 transition-all">
                          <div className="relative aspect-[3/4] bg-muted/60">
                            {item.coverImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewItem(item)}
                                className="absolute inset-0 block w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                              >
                                <img
                                  src={item.coverImageUrl}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                  loading="lazy"
                                />
                                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <Maximize2 className="h-3 w-3" aria-hidden />
                                  Preview
                                </span>
                                <span className="sr-only">Open cover preview</span>
                              </button>
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                                <BookOpen className="h-12 w-12 opacity-35" aria-hidden />
                                <p className="text-xs max-w-[14rem]">
                                  Add a cover image in Admin → Flipbooks to show a preview here.
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="p-5 md:p-6 flex flex-col flex-1">
                            <div className="flex items-start gap-3 mb-4 min-h-0">
                              <div className="rounded-xl bg-accent/10 p-3 text-accent shrink-0">
                                <BookOpen className="h-6 w-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-serif text-lg md:text-xl text-foreground leading-snug line-clamp-3">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Digital flipbook edition</p>
                              </div>
                            </div>
                            <div className="mt-auto pt-2">
                              <Button asChild className="w-full sm:w-auto gap-2" size="lg">
                                <Link to={flipbookHref(item.slug)}>
                                  Open flipbook
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </article>
                      </ScrollReveal>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="max-w-[min(96vw,900px)] w-full p-0 gap-0 border border-border/50 bg-background shadow-2xl sm:rounded-xl overflow-hidden">
            {previewItem?.coverImageUrl && (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>{previewItem.title}</DialogTitle>
                  <DialogDescription>Cover preview</DialogDescription>
                </DialogHeader>
                <div className="max-h-[min(85vh,960px)] w-full overflow-auto bg-muted/20 p-2 sm:p-4 flex items-center justify-center">
                  <img
                    src={previewItem.coverImageUrl}
                    alt={previewItem.title}
                    className="max-h-[min(80vh,900px)] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/40 px-5 py-4">
                  <p className="font-serif text-base text-foreground pr-2">{previewItem.title}</p>
                  <Button asChild>
                    <Link to={flipbookHref(previewItem.slug)} onClick={() => setPreviewItem(null)}>
                      Open full flipbook
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default EMagazines;
