import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildNewsPath } from "@/lib/seo";
import { getCategoryPillClass, getCategoryTheme } from "@/lib/categoryTheme";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type BlogPost = {
  id: number | string;
  image?: string;
  imageUrl?: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
};

function getPostImageSrc(post: BlogPost): string {
  if (post.imageUrl) return post.imageUrl;
  if (typeof post.image === "string") return post.image;
  return "";
}

const categorySlugToLabel: Record<string, string> = {
  education: "Education",
  policy: "Policy",
  parenting: "Parenting",
  "expert-view": "Expert View",
  technology: "Technology",
};

const categories = [
  "All",
  "Education",
  "Policy",
  "Parenting",
  "Expert View",
  "Technology",
];

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const pageFromUrl = searchParams.get("page");
  const initialCategory =
    categoryFromUrl && categorySlugToLabel[categoryFromUrl]
      ? categorySlugToLabel[categoryFromUrl]
      : "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiPosts, setApiPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/blogs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BlogPost[]) => {
        const mapped = (Array.isArray(data) ? data : []).map((p: { _id?: string; id?: string; createdAt?: string; excerpt?: string; readTime?: string; featuredImageUrl?: string }) => ({
          id: (p as BlogPost).id || (p._id || "").toString(),
          imageUrl: (p as BlogPost).imageUrl || (p as { featuredImageUrl?: string }).featuredImageUrl,
          title: (p as BlogPost).title,
          excerpt: (p as BlogPost).excerpt || p.excerpt || "",
          date: (p as BlogPost).date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""),
          category: (p as BlogPost).category,
          readTime: (p as BlogPost).readTime || p.readTime || "4 min read",
        }));
        setApiPosts(mapped);
      })
      .catch(() => setApiPosts([]));
  }, []);

  useEffect(() => {
    if (categoryFromUrl && categorySlugToLabel[categoryFromUrl]) {
      setActiveCategory(categorySlugToLabel[categoryFromUrl]);
    }
  }, [categoryFromUrl]);

  const blogPosts = apiPosts;
  const filteredPosts = blogPosts.filter((post) => {
    const matchCategory =
      activeCategory === "All" || post.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(
    Math.max(1, parseInt(pageFromUrl || "1", 10) || 1),
    totalPages
  );
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const featuredPost = paginatedPosts[0];
  const gridPosts = paginatedPosts.slice(1);

  const pageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `/blog?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 text-accent mb-4">
                <BookOpen className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Brainfeed Blog
                </span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-[3.25rem] lg:text-6xl text-foreground leading-tight">
                Ideas, insights and stories from education.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground font-sans">
                Expert views, policy updates, and inspiration for educators and
                parents.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters + search */}
        <section className="bg-background border-b border-border/50 py-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search blog posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 h-11 rounded-lg border-border bg-card"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeCategory === cat
                        ? "bg-accent text-accent-foreground"
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

        {/* Blog grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            <AnimatePresence mode="wait">
              {paginatedPosts.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground py-16"
                >
                  No articles match your filters.
                </motion.p>
              ) : (
                <>
                  {/* Featured post */}
                  {featuredPost && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-12 md:mb-16"
                    >
                      <Link
                        to={buildNewsPath(featuredPost.title, featuredPost.id)}
                        className="group block rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300 p-6 sm:p-8 md:p-10"
                      >
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 ${getCategoryPillClass(featuredPost.category || "")}`}>
                          {featuredPost.category}
                        </span>
                        <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-tight group-hover:text-accent transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="mt-3 text-muted-foreground font-sans leading-relaxed line-clamp-2">
                          {featuredPost.excerpt}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-sans">
                          {(() => {
                            const th = getCategoryTheme(featuredPost.category || "");
                            return (
                              <>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                >
                                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                  {featuredPost.date}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                >
                                  {featuredPost.readTime}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-4 text-accent text-xs font-semibold uppercase tracking-wider group-hover:gap-2 transition-all">
                          Read more
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </motion.div>
                  )}

                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: { staggerChildren: 0.06 },
                      },
                      hidden: {},
                    }}
                  >
                  {gridPosts.map((post, index) => (
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
                        to={buildNewsPath(post.title, post.id)}
                        className="block h-full rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 p-5 sm:p-6"
                      >
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2 ${getCategoryPillClass(post.category || "")}`}>
                          {post.category}
                        </span>
                        <h3 className="font-serif text-lg sm:text-xl text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-sans">
                          {post.excerpt}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                          {(() => {
                            const th = getCategoryTheme(post.category || "");
                            return (
                              <>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                >
                                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                  {post.date}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${th.metaBg} ${th.metaText}`}
                                >
                                  {post.readTime}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-4 text-accent text-xs font-semibold uppercase tracking-wider group-hover:gap-2 transition-all">
                          Read more
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </motion.article>
                  ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-14 flex justify-center flex-wrap gap-2"
                aria-label="Blog pagination"
              >
                <Link
                  to={pageUrl(currentPage - 1)}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium transition-colors ${
                    currentPage <= 1
                      ? "pointer-events-none text-muted-foreground opacity-60"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  Previous
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    to={pageUrl(p)}
                    className={`inline-flex items-center justify-center min-w-[2.5rem] px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  to={pageUrl(currentPage + 1)}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium transition-colors ${
                    currentPage >= totalPages
                      ? "pointer-events-none text-muted-foreground opacity-60"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  Next
                </Link>
              </motion.nav>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default Blog;
