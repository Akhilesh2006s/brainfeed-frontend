import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { buildApiUrl } from "@/lib/apiUrl";
import { Images } from "lucide-react";

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
            {items.map((item) => (
              <ScrollReveal key={item.id}>
                <article className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {item.kind === "youtube" && item.embedUrl ? (
                    <div className="aspect-video bg-muted w-full">
                      <iframe
                        title={item.title || "YouTube video"}
                        src={item.embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : item.imageUrl ? (
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Gallery image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
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
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
