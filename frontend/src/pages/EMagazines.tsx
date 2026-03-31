import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { buildApiUrl } from "@/lib/apiUrl";
import { BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type FlipbookListItem = {
  title: string;
  slug: string;
  updatedAt?: string;
  createdAt?: string;
  issueDate?: string;
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
                        <article className="rounded-2xl border border-border/60 bg-card/50 p-5 md:p-6 h-full flex flex-col shadow-sm hover:shadow-md hover:border-accent/30 transition-all">
                          <div className="flex items-start gap-3 mb-4">
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
                              <Link to={`/flipbook/${encodeURIComponent(item.slug)}`}>
                                Open flipbook
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
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
      </main>
      <Footer />
    </div>
  );
};

export default EMagazines;
