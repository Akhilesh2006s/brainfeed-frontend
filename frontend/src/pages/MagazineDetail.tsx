import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import mainCover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM.jpeg";
import juniorCover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM (1).jpeg";
import primaryICover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM (2).jpeg";
import primaryIICover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.31 AM.jpeg";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

type MagazineConfig = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  cover: string;
  blurb: string;
  category: string;
  details: string;
};

const MAGAZINES: Record<string, MagazineConfig> = {
  main: {
    id: "main",
    name: "Brainfeed Magazine",
    price: 2500,
    priceLabel: "₹2,500.00",
    cover: mainCover,
    blurb: "Relevant for educators · 12 issues/year",
    category: "Primary Magazines",
    details:
      "Brainfeed Magazine is designed for school leaders, educators, and decision-makers who want in-depth coverage of education trends, policy changes, and classroom innovations.",
  },
  "primary-i": {
    id: "primary-i",
    name: "Brainfeed Primary I",
    price: 1050,
    priceLabel: "₹1,050.00",
    cover: primaryICover,
    blurb: "For classes I–II · 6–8 years · 12 issues/year",
    category: "Primary Magazines",
    details:
      "Colourful, activity-based content that nurtures curiosity, reading habits, and foundational skills for early primary learners.",
  },
  "primary-ii": {
    id: "primary-ii",
    name: "Brainfeed Primary II",
    price: 1050,
    priceLabel: "₹1,050.00",
    cover: primaryIICover,
    blurb: "For classes III–V · 8–10 years · 12 issues/year",
    category: "Primary Magazines",
    details:
      "Engaging stories, puzzles, and knowledge features tailored for upper primary students to expand their horizons.",
  },
  junior: {
    id: "junior",
    name: "Brainfeed Junior",
    price: 850,
    priceLabel: "₹850.00",
    cover: juniorCover,
    blurb: "For 3–6 age group · 12 issues/year",
    category: "Junior Magazines",
    details:
      "Illustrated, age-appropriate content that gently introduces young children to the world around them through stories and visuals.",
  },
};

const formatRupees = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const MagazineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const magazine = (id && MAGAZINES[id]) || MAGAZINES.main;
  const { addItem } = useCart();
  const { settings } = useSiteSettings();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (quantity <= 0) return;
    addItem(
      {
        id: `magazine-${magazine.id}`,
        name: magazine.name,
        price: magazine.price,
      },
      quantity,
    );
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareUrlBase = encodeURIComponent(pageUrl);
  const shareText = magazine.name;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlBase}`;
  const twHref = `https://twitter.com/intent/tweet?url=${shareUrlBase}&text=${encodeURIComponent(shareText)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlBase}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(shareText)}&body=${shareUrlBase}`;
  const igHref = settings?.footer?.social?.instagram || "https://www.instagram.com/";

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        <section className="border-b border-border/60 py-6 md:py-8">
          <div className="container">
            <ScrollReveal direction="up" once>
              <nav className="text-xs text-muted-foreground font-sans mb-2">
                <Link to="/" className="hover:text-accent">
                  Home
                </Link>
                <span className="mx-1">›</span>
                <Link to="/subscribe" className="hover:text-accent">
                  Primary Magazines
                </Link>
                <span className="mx-1">›</span>
                <span className="text-foreground">{magazine.name}</span>
              </nav>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground">
                {magazine.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground font-sans">
                {magazine.blurb}
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
            <ScrollReveal direction="up" once>
              <div className="w-full max-w-[520px] mx-auto border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
                <img
                  src={magazine.cover}
                  alt={magazine.name}
                  className="w-full h-auto object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" once>
                <div className="space-y-5">
                <div>
                  <p className="text-2xl md:text-3xl font-semibold text-foreground">
                    {magazine.priceLabel || formatRupees(magazine.price)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground font-sans">
                    {magazine.blurb}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground font-sans">
                  <p>{magazine.details}</p>
                  <p className="mt-2">
                    Annual print subscription. Final shipping arrangements and payment will be
                    confirmed by the Brainfeed team after you submit your order.
                  </p>
                </div>

                <div className="pt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-9 w-9 flex items-center justify-center rounded-full border border-border/80 text-sm font-semibold text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        −
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-medium">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-9 w-9 flex items-center justify-center rounded-full border border-border/80 text-sm font-semibold text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                      type="button"
                      className="w-full sm:w-auto rounded-full px-8 text-xs font-semibold uppercase tracking-[0.18em]"
                      onClick={handleAddToCart}
                    >
                      Add to cart
                    </Button>
                    <p className="text-xs text-muted-foreground font-sans">
                      Category: <span className="text-foreground">{magazine.category}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    Share
                  </p>
                  <div className="flex gap-3 text-muted-foreground">
                    <a
                      href={fbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Share on Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a
                      href={twHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Share on Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                    <a
                      href={igHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Open Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      href={liHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Share on LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                    <a
                      href={mailHref}
                      className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label="Share via email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MagazineDetail;

