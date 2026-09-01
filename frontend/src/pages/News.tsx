import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildNewsPath } from "@/lib/seo";
import { getCategoryTheme as getNewsCategoryTheme } from "@/lib/categoryTheme";
import { buildApiUrl } from "@/lib/apiUrl";

const newsCategorySlugToLabel: Record<string, string> = {
  education: "Education",
  policy: "Policy",
  parenting: "Parenting",
  technology: "Technology",
  "expert-view": "Expert View",
  "editors-pick": "Editor's Pick",
  "press-release": "Press Release",
};

const newsCategoryLabelToSlug: Record<string, string> = Object.entries(
  newsCategorySlugToLabel
).reduce((acc, [slug, label]) => {
  acc[label] = slug;
  return acc;
}, {} as Record<string, string>);

const newsCategories = [
  "All",
  "Education",
  "Policy",
  "Parenting",
  "Expert View",
  "Editor's Pick",
  "Technology",
  "Press Release",
];

const NEWS_CACHE_KEY = "brainfeed:news-articles:v1";

type NewsArticle = {
  id: number | string;
  slug?: string;
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
};

function getArticleImageSrc(article: NewsArticle): string {
  if (article.imageUrl) return article.imageUrl;
  if (typeof article.image === "string") return article.image;
  return "";
}

function readCachedArticles(): NewsArticle[] {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const initialCategory =
    categoryFromUrl && newsCategorySlugToLabel[categoryFromUrl]
      ? newsCategorySlugToLabel[categoryFromUrl]
      : "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiArticles, setApiArticles] = useState<NewsArticle[]>(readCachedArticles);
  const [isLoading, setIsLoading] = useState(() => readCachedArticles().length === 0);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    document.title = "Education News India | Latest School & Exam Updates";

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "description";
      document.head.appendChild(metaEl);
    }
    metaEl.content =
      "Get the latest education news, board exam updates, results, and policy changes across India.";

    return () => {
      document.title = originalTitle;
      if (metaEl && originalDescription !== null && originalDescription !== undefined) {
        metaEl.content = originalDescription;
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    if (apiArticles.length === 0) setIsLoading(true);

    fetch(buildApiUrl("/articles"), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Articles request failed (${res.status})`);
        return res.json();
      })
      .then((data: NewsArticle[]) => {
        if (!Array.isArray(data)) throw new Error("Invalid articles response");
        setApiArticles(data);
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (categoryFromUrl && newsCategorySlugToLabel[categoryFromUrl]) {
      setActiveCategory(newsCategorySlugToLabel[categoryFromUrl]);
    } else if (!categoryFromUrl) {
      // When there is no category query (e.g. user clicked "All News" in header),
      // always reset the active filter back to "All".
      setActiveCategory("All");
    }
  }, [categoryFromUrl]);

  const newsArticles = apiArticles;
  const filteredArticles = newsArticles.filter((article) => {
    const matchCategory =
      activeCategory === "All" || article.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        <section className="relative py-8 md:py-10 lg:py-12 overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 text-accent mb-4">
                <Newspaper className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Brainfeed News
                </span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-[3.25rem] lg:text-6xl text-foreground leading-tight">
                Latest education news and updates.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground font-sans">
                Board exams, policy updates, and headlines from the education sector.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="bg-background border-b border-border/50 py-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 h-11 rounded-lg border-border bg-card"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {newsCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      if (cat === "All") {
                        // Clear category from URL when "All" is selected
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete("category");
                          return next;
                        });
                      } else {
                        const slug = newsCategoryLabelToSlug[cat];
                        if (slug) {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.set("category", slug);
                            return next;
                          });
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeCategory === cat
                        ? `${getNewsCategoryTheme(cat).pillBg} ${getNewsCategoryTheme(cat).pillText}`
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container">
            <AnimatePresence mode="wait">
              {isLoading && apiArticles.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"
                  aria-live="polite"
                  aria-label="Loading news articles"
                >
                  {[0, 1].map((item) => (
                    <div key={item} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
                      <div className="aspect-[16/8] animate-pulse bg-muted" />
                      <div className="space-y-3 p-6">
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-7 w-5/6 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                  <p className="col-span-full text-center text-sm text-muted-foreground">
                    Loading the latest news…
                  </p>
                </motion.div>
              ) : loadError && apiArticles.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                  role="alert"
                >
                  <p className="text-muted-foreground">News is taking longer than expected to load.</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                  >
                    Try again
                  </button>
                </motion.div>
              ) : filteredArticles.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground py-16"
                >
                  No news articles match your search.
                </motion.p>
              ) : (
                <>
                  {featuredArticle && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-12 md:mb-16"
                    >
                      <Link
                        to={buildNewsPath(featuredArticle.title, featuredArticle.id, featuredArticle.slug)}
                        className="group block rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300"
                      >
                        <div className="grid md:grid-cols-2 gap-0">
                          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-muted/40">
                            <img
                              src={getArticleImageSrc(featuredArticle)}
                              alt={featuredArticle.imageAlt || featuredArticle.title}
                              className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full ${getNewsCategoryTheme(featuredArticle.category).pillBg} ${getNewsCategoryTheme(featuredArticle.category).pillText} text-[10px] font-semibold uppercase tracking-wider mb-3`}
                            >
                              {featuredArticle.category}
                            </span>
                            <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-tight group-hover:text-accent transition-colors">
                              {featuredArticle.title}
                            </h2>
                            <p className="mt-3 text-muted-foreground font-sans leading-relaxed line-clamp-2">
                              {featuredArticle.excerpt}
                            </p>
                            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-sans">
                              {(() => {
                                const th = getNewsCategoryTheme(featuredArticle.category);
                                return (
                                  <>
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                    >
                                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                      {featuredArticle.date}
                                    </span>
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                    >
                                      {featuredArticle.readTime}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <span className="inline-flex items-center gap-1 mt-4 text-accent text-xs font-semibold uppercase tracking-wider group-hover:gap-2 transition-all">
                              Read more
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}

                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.06 } },
                      hidden: {},
                    }}
                  >
                    {gridArticles.map((post, index) => (
                      <motion.article
                        key={post.id}
                        layout
                        variants={{
                          hidden: { opacity: 0, y: 24 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.4 }}
                        className="group"
                      >
                        <Link
                          to={buildNewsPath(post.title, post.id, post.slug)}
                          className="block h-full rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                        >
                          <div className="relative overflow-hidden aspect-[16/10] bg-muted/40">
                            <img
                              src={getArticleImageSrc(post)}
                              alt={post.imageAlt || post.title}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                            <span
                              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full ${getNewsCategoryTheme(post.category).overlayBg} ${getNewsCategoryTheme(post.category).overlayText} text-[10px] font-semibold uppercase tracking-wider`}
                            >
                              {post.category}
                            </span>
                          </div>
                          <div className="p-5 sm:p-6">
                            <h3 className="font-serif text-lg sm:text-xl text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                              {post.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-sans">
                              {post.excerpt}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-sans">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${getNewsCategoryTheme(post.category).metaBg} ${getNewsCategoryTheme(post.category).metaText}`}>
                                <Calendar className="h-3.5 w-3.5" />
                                {post.date}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 ${getNewsCategoryTheme(post.category).metaBg} ${getNewsCategoryTheme(post.category).metaText}`}>
                                {post.readTime}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 mt-4 text-accent text-xs font-semibold uppercase tracking-wider group-hover:gap-2 transition-all">
                              Read more
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </Link>
                      </motion.article>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default News;
