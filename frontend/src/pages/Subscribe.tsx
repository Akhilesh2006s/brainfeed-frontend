import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Eye } from "lucide-react";
import magazineCover from "@/assets/magazine-cover.jpg";
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";

const shippingNotes = [
  "The subscription would begin from the next month cycle from the date of order.",
  "The order is accepted for an annual subscription only (12 months).",
  "The magazines will be delivered on or before 20th of that month.",
];

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type Product = {
  id: string;
  slug: string;
  category: "pre-primary" | "library" | "classroom" | "magazine";
  name: string;
  description?: string;
  badge?: string;
  tag?: string;
  price: number;
  oldPrice?: number;
  currency?: string;
  imageUrl?: string;
};

// DEV-only fallback so the Subscribe layout can be validated even if /api/products is empty.
const devFallbackProducts: Product[] = [
  {
    id: "pre-primary-1",
    slug: "pre-primary-combo-pack",
    category: "pre-primary",
    name: "Pre Primary Combo Pack",
    description: "Annual subscription bundle designed for early-years classrooms.",
    badge: "Popular",
    tag: "Pre Primary Packs",
    price: 4500,
    oldPrice: 5200,
    currency: "INR",
    imageUrl: news1,
  },
  {
    id: "pre-primary-2",
    slug: "pre-primary-best-pack",
    category: "pre-primary",
    name: "Pre Primary Best Pack",
    description: "Curated reading bundle for pre-primary learners.",
    badge: "Best value",
    tag: "Pre Primary Packs",
    price: 5000,
    oldPrice: 5800,
    currency: "INR",
    imageUrl: news2,
  },
  {
    id: "pre-primary-3",
    slug: "pre-primary-big-pack",
    category: "pre-primary",
    name: "Pre Primary Big Pack",
    description: "Bigger classroom kit with more monthly editions.",
    badge: "",
    tag: "Pre Primary Packs",
    price: 6200,
    currency: "INR",
    imageUrl: magazineCover,
  },
  {
    id: "library-1",
    slug: "school-library-pack",
    category: "library",
    name: "School Library Pack",
    description: "Curated magazines set for school libraries.",
    badge: "Best value",
    tag: "Library Packs",
    price: 7500,
    oldPrice: 8900,
    currency: "INR",
    imageUrl: magazineCover,
  },
  {
    id: "library-2",
    slug: "library-explorer-pack",
    category: "library",
    name: "Library Explorer Pack",
    description: "A well-rounded set for classrooms and libraries.",
    badge: "Popular",
    tag: "Library Packs",
    price: 7100,
    currency: "INR",
    imageUrl: news1,
  },
  {
    id: "library-3",
    slug: "library-pro-pack",
    category: "library",
    name: "Library Pro Pack",
    description: "More titles, better coverage, consistent reading culture.",
    badge: "",
    tag: "Library Packs",
    price: 8200,
    currency: "INR",
    imageUrl: news2,
  },
  {
    id: "classroom-1",
    slug: "classroom-engagement-pack",
    category: "classroom",
    name: "Classroom Engagement Pack",
    description: "Bulk magazines for active classroom sessions.",
    badge: "",
    tag: "Classroom Packs",
    price: 6800,
    oldPrice: 7800,
    currency: "INR",
    imageUrl: news1,
  },
  {
    id: "classroom-2",
    slug: "classroom-creative-pack",
    category: "classroom",
    name: "Classroom Creative Pack",
    description: "Enrich lesson plans with curated reading editions.",
    badge: "",
    tag: "Classroom Packs",
    price: 6400,
    currency: "INR",
    imageUrl: news2,
  },
  {
    id: "classroom-3",
    slug: "classroom-mega-pack",
    category: "classroom",
    name: "Classroom Mega Pack",
    description: "For high participation classrooms and reading programs.",
    badge: "",
    tag: "Classroom Packs",
    price: 7600,
    currency: "INR",
    imageUrl: magazineCover,
  },
  {
    id: "magazine-1",
    slug: "brainfeed-magazine-annual",
    category: "magazine",
    name: "Brainfeed Magazine - Annual",
    description: "Annual subscription to Brainfeed Magazine.",
    badge: "New",
    tag: "Magazines",
    price: 1800,
    oldPrice: 2200,
    currency: "INR",
    imageUrl: magazineCover,
  },
];

const formatRupees = (amount: number, currency = "INR") =>
  amount.toLocaleString("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });

const Subscribe = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    document.title = "Subscribe to Brainfeed Magazine | Get Monthly Magazine & Updates";

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "description";
      document.head.appendChild(metaEl);
    }
    metaEl.content =
      "Subscribe to Brainfeed Magazine and stay updated with the latest monthly magazines, education news, EdTech trends, school insights, and exclusive content.";

    return () => {
      document.title = originalTitle;
      if (metaEl && originalDescription !== null && originalDescription !== undefined) {
        metaEl.content = originalDescription;
      }
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/products`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        if (Array.isArray(data) && data.length) {
          setProducts(data);
          return;
        }

        // When backend data is missing/empty, show placeholder set
        // so UI + responsive behavior can still be validated.
        if (import.meta.env.DEV) setProducts(devFallbackProducts);
      })
      .catch(() => {
        if (import.meta.env.DEV) setProducts(devFallbackProducts);
      });
  }, []);

  const prePrimaryPacks = products.filter((p) => p.category === "pre-primary");
  const libraryPacks = products.filter((p) => p.category === "library");
  const classroomPacks = products.filter((p) => p.category === "classroom");
  const magazines = products.filter((p) => p.category === "magazine");

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative min-h-[40vh] md:min-h-[45vh] flex items-end overflow-hidden border-b border-border/60">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/subscribe-hero-family.png')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
          <div className="relative z-10 w-full px-4 sm:px-5 md:px-6 lg:px-8 pb-12 pt-24 md:pb-16 md:pt-28">
            <ScrollReveal direction="up" once>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
                Subscribe
              </h1>
              <p className="mt-4 max-w-2xl text-foreground/80 font-sans">
                Choose from curated packs for classrooms, libraries and pre-primary learners, or subscribe to individual Brainfeed magazines.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Packs */}
        <section className="py-12 md:py-16 border-b border-border/50">
          <div className="w-full px-4 sm:px-5 md:px-6 lg:px-8 space-y-12 md:space-y-14">
            <ScrollReveal direction="up" once>
              <h2 className="section-title">Pre Primary Packs</h2>
            </ScrollReveal>
            <div className="w-full grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch justify-items-stretch">
              {prePrimaryPacks.map((pack) => (
                <ScrollReveal key={pack.name} direction="up" once>
                  <Card className="glass-card h-full flex flex-col w-full">
                    <CardHeader className="p-4 pb-3">
                      {pack.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <Link to={`/product/${pack.slug}`}>
                            <img
                              src={pack.imageUrl}
                              alt={pack.name}
                              className="w-full h-32 object-contain object-center bg-white transition-transform hover:scale-[1.02] md:h-48 md:object-contain"
                            />
                          </Link>
                        </div>
                      )}
                      <div className="mb-2 flex flex-col gap-2">
                        {pack.badge ? (
                          <span className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 text-center leading-snug">
                            {pack.badge}
                          </span>
                        ) : null}
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground leading-relaxed break-words">
                          {pack.tag || "Pre Primary Packs"}
                        </p>
                      </div>
                      <CardTitle className="text-lg font-serif">
                        <Link to={`/product/${pack.slug}`} className="hover:text-accent">
                          {pack.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-[13px]">
                        {pack.description || "Ideal bundle for early-years classrooms and centres."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 mb-4">
                        {pack.oldPrice ? (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatRupees(pack.oldPrice, pack.currency)}
                          </p>
                        ) : null}
                        <p className="text-lg font-semibold text-foreground">
                          {formatRupees(pack.price, pack.currency)}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      <Button variant="outline" className="w-full rounded-lg text-xs font-semibold uppercase tracking-[0.16em] border-border" asChild>
                        <Link to={`/product/${pack.slug}`} className="inline-flex items-center justify-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Quick view
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs font-semibold uppercase tracking-[0.18em]"
                        onClick={() =>
                          addItem({
                            id: `pre-primary-${pack.name}`,
                            name: `${pack.name} (Pre Primary Pack)`,
                            price: pack.price,
                          })
                        }
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" once>
              <h2 className="section-title mt-8">Library Packs</h2>
            </ScrollReveal>
            <div className="w-full grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch justify-items-stretch">
              {libraryPacks.map((pack) => (
                <ScrollReveal key={pack.name} direction="up" once>
                  <Card className="glass-card h-full flex flex-col w-full">
                    <CardHeader className="p-4 pb-3">
                      {pack.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <Link to={`/product/${pack.slug}`}>
                            <img
                              src={pack.imageUrl}
                              alt={pack.name}
                              className="w-full h-32 object-contain object-center bg-white transition-transform hover:scale-[1.02] md:h-48 md:object-contain"
                            />
                          </Link>
                        </div>
                      )}
                      <div className="mb-2 flex flex-col gap-2">
                        {pack.badge ? (
                          <span className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 text-center leading-snug">
                            {pack.badge}
                          </span>
                        ) : null}
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground leading-relaxed break-words">
                          Library Packs
                        </p>
                      </div>
                      <CardTitle className="text-lg font-serif">
                        <Link to={`/product/${pack.slug}`} className="hover:text-accent">
                          {pack.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-[13px]">
                        {pack.description || "Thoughtfully curated for school and institutional libraries."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 mb-4">
                        {pack.oldPrice ? (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatRupees(pack.oldPrice, pack.currency)}
                          </p>
                        ) : null}
                        <p className="text-lg font-semibold text-foreground">
                          {formatRupees(pack.price, pack.currency)}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      <Button variant="outline" className="w-full rounded-lg text-xs font-semibold uppercase tracking-[0.16em] border-border" asChild>
                        <Link to={`/product/${pack.slug}`} className="inline-flex items-center justify-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Quick view
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs font-semibold uppercase tracking-[0.18em]"
                        onClick={() =>
                          addItem({
                            id: `library-${pack.name}`,
                            name: `${pack.name} (Library Pack)`,
                            price: pack.price,
                          })
                        }
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" once>
              <h2 className="section-title mt-8">Classroom Packs</h2>
            </ScrollReveal>
            <div className="w-full grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch justify-items-stretch">
              {classroomPacks.map((pack) => (
                <ScrollReveal key={pack.name} direction="up" once>
                  <Card className="glass-card h-full flex flex-col w-full">
                    <CardHeader className="p-4 pb-3">
                      {pack.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <Link to={`/product/${pack.slug}`}>
                            <img
                              src={pack.imageUrl}
                              alt={pack.name}
                              className="w-full h-32 object-contain object-center bg-white transition-transform hover:scale-[1.02] md:h-48 md:object-contain"
                            />
                          </Link>
                        </div>
                      )}
                      <div className="mb-2 flex flex-col gap-2">
                        {pack.badge ? (
                          <span className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 text-center leading-snug">
                            {pack.badge}
                          </span>
                        ) : null}
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground leading-relaxed break-words">
                          Classroom Packs
                        </p>
                      </div>
                      <CardTitle className="text-lg font-serif">
                        <Link to={`/product/${pack.slug}`} className="hover:text-accent">
                          {pack.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-[13px]">
                        {pack.description || "Bulk magazine packs for whole-class engagement."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 mb-4">
                        {pack.oldPrice ? (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatRupees(pack.oldPrice, pack.currency)}
                          </p>
                        ) : null}
                        <p className="text-lg font-semibold text-foreground">
                          {formatRupees(pack.price, pack.currency)}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      <Button variant="outline" className="w-full rounded-lg text-xs font-semibold uppercase tracking-[0.16em] border-border" asChild>
                        <Link to={`/product/${pack.slug}`} className="inline-flex items-center justify-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Quick view
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs font-semibold uppercase tracking-[0.18em]"
                        onClick={() =>
                          addItem({
                            id: `classroom-${pack.name}`,
                            name: `${pack.name} (Classroom Pack)`,
                            price: pack.price,
                          })
                        }
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Individual magazines */}
        <section className="py-12 md:py-16">
          <div className="w-full px-4 sm:px-5 md:px-6 lg:px-8">
            <ScrollReveal direction="up" once>
              <h2 className="section-title">Brainfeed Magazines</h2>
              <p className="text-muted-foreground font-sans mt-3 mb-8 max-w-2xl">
                Subscribe to individual titles across age groups — from Brainfeed Junior to Brainfeed High — and build a rich reading culture in your school.
              </p>
            </ScrollReveal>
            <div className="w-full grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-stretch justify-items-stretch">
              {magazines.map((mag) => (
                <ScrollReveal key={mag.name} direction="up" once>
                  <Card className="glass-card h-full flex flex-col items-stretch w-full">
                    <CardHeader className="p-3 pb-2">
                      {mag.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <Link to={`/product/${mag.slug}`}>
                            <div className="w-full aspect-[3/4] bg-white">
                              <img
                                src={mag.imageUrl}
                                alt={mag.name}
                                className="w-full h-full object-cover md:object-contain transition-transform hover:scale-[1.02]"
                              />
                            </div>
                          </Link>
                        </div>
                      )}
                      <CardTitle className="text-base font-serif">
                        <Link to={`/product/${mag.slug}`} className="hover:text-accent">
                          {mag.name}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <p className="text-[13px] text-muted-foreground mb-3">
                        {mag.description || ""}
                      </p>
                      <div className="space-y-1 mb-4">
                        {mag.oldPrice != null && mag.oldPrice > 0 ? (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatRupees(mag.oldPrice, mag.currency)}
                          </p>
                        ) : null}
                        <p className="text-xl font-bold text-foreground tracking-tight">
                          {formatRupees(mag.price, mag.currency)}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      <Button variant="outline" className="w-full rounded-lg text-xs font-semibold uppercase tracking-[0.16em] border-border" asChild>
                        <Link to={`/product/${mag.slug}`} className="inline-flex items-center justify-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Quick view
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs font-semibold uppercase tracking-[0.18em]"
                        onClick={() =>
                          addItem({
                            id: `magazine-${mag.name}`,
                            name: mag.name,
                            price: mag.price,
                          })
                        }
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Shipping policy — at end of page */}
        <section className="scroll-mt-28 pt-12 pb-12 md:pt-14 md:pb-16 border-t border-border/50">
          <div className="w-full px-4 sm:px-5 md:px-6 lg:px-8">
            <ScrollReveal direction="up" once>
              <h2 className="section-title">Shipping Policy</h2>
              <ul className="mt-4 space-y-2 text-sm md:text-base text-muted-foreground font-sans">
                {shippingNotes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Subscribe;

