import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

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
  galleryImageUrls?: string[];
};

const formatRupees = (amount: number, currency = "INR") =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const categoryLabel: Record<Product["category"], string> = {
  "pre-primary": "Pre Primary Packs",
  library: "Library Packs",
  classroom: "Classroom Packs",
  magazine: "Primary Magazines",
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { settings } = useSiteSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const productImages = useMemo(() => {
    if (!product) return [];
    const main = product.imageUrl?.trim();
    const extras = (product.galleryImageUrls || []).map((u) => String(u || "").trim()).filter(Boolean);
    const ordered: string[] = [];
    const seen = new Set<string>();
    if (main) {
      ordered.push(main);
      seen.add(main);
    }
    for (const u of extras) {
      if (!seen.has(u)) {
        ordered.push(u);
        seen.add(u);
      }
    }
    return ordered;
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  useEffect(() => {
    setSelectedImage((i) => {
      if (productImages.length === 0) return 0;
      return Math.min(i, productImages.length - 1);
    });
  }, [productImages.length]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/api/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((items: Product[]) => {
        const found = Array.isArray(items) ? items.find((p) => p.slug === slug) : undefined;
        setProduct(found || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || quantity <= 0) return;
    addItem(
      {
        id: `product-${product.id}`,
        name: product.name,
        price: product.price,
      },
      quantity,
    );
  };

  const priceLabel =
    product && formatRupees(product.price, product.currency || "INR");

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareUrlBase = encodeURIComponent(pageUrl);
  const shareText = product?.name || "Brainfeed";
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
                  Subscriptions
                </Link>
                {product && (
                  <>
                    <span className="mx-1">›</span>
                    <span className="text-foreground">{product.name}</span>
                  </>
                )}
              </nav>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground">
                {product ? product.name : loading ? "Loading product…" : "Product not found"}
              </h1>
              {product && (
                <p className="mt-2 text-sm text-muted-foreground font-sans max-w-2xl">
                  {product.description ||
                    "Annual subscription thoughtfully designed to build a strong reading culture."}
                </p>
              )}
            </ScrollReveal>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container">
            {loading && (
              <p className="text-sm text-muted-foreground font-sans">
                Loading subscription details…
              </p>
            )}
            {!loading && !product && (
              <p className="text-sm text-muted-foreground font-sans">
                We couldn’t find this subscription product. It may have been removed or is not active.
              </p>
            )}
            {!loading && product && (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
                <ScrollReveal direction="up" once>
                  <div
                    className="flex w-full max-w-[520px] mx-auto gap-4 items-start flex-col"
                  >
                    <div className="flex-1 min-w-0 w-full border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
                      {productImages.length > 0 ? (
                        <img
                          src={productImages[selectedImage] ?? productImages[0]}
                          alt={product.name}
                          className="w-full h-auto object-contain bg-white min-h-[200px]"
                        />
                      ) : (
                        <div className="aspect-[3/4] flex items-center justify-center text-muted-foreground text-sm">
                          No image available
                        </div>
                      )}
                    </div>
                    {productImages.length > 1 && (
                      <div
                        className="flex flex-row gap-2 overflow-x-auto shrink-0 w-full justify-center px-1 pb-1 -mx-1"
                        role="tablist"
                        aria-label="Product images"
                      >
                        {productImages.map((url, idx) => (
                          <button
                            key={`${url}-${idx}`}
                            type="button"
                            role="tab"
                            aria-selected={selectedImage === idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`shrink-0 rounded-2xl border-2 bg-white p-0.5 transition-all ${
                              selectedImage === idx
                                ? "border-accent shadow-[0_0_0_1px_hsl(var(--accent))]"
                                : "border-border/60 hover:border-border"
                            }`}
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-[0.85rem]"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up" once>
                  <div className="space-y-5">
                    <div>
                      {product.oldPrice ? (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatRupees(product.oldPrice, product.currency)}
                        </p>
                      ) : null}
                      <p className="text-2xl md:text-3xl font-semibold text-foreground">
                        {priceLabel}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground font-sans">
                        Annual print subscription · 12 issues/year
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground font-sans">
                      {product.description && <p>{product.description}</p>}
                      <p className="mt-2">
                        Final shipping arrangements and payment will be confirmed by the Brainfeed
                        team after you submit your order.
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
                          Category:{" "}
                          <span className="text-foreground">
                            {categoryLabel[product.category] || product.category}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="border-top border-border/40 pt-4">
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
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;

