import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";
import { buildNewsPath } from "@/lib/seo";
import { getCategoryTheme } from "@/lib/categoryTheme";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type NewsArticle = {
  id: string | number;
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  author?: string;
};

interface LatestNewsProps {
  articles?: NewsArticle[];
  featuredId?: string;
  sideIds?: string[];
}

function getImageSrc(article: Pick<NewsArticle, "imageUrl">) {
  return (article.imageUrl || "").trim();
}


const LatestNews = ({ articles: articlesProp, featuredId, sideIds }: LatestNewsProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>(articlesProp || []);

  useEffect(() => {
    if (articlesProp && articlesProp.length) {
      setArticles(articlesProp);
      return;
    }
    fetch(`${API_BASE}/api/articles`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: NewsArticle[]) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
  }, [articlesProp]);

  if (!articles.length) {
    return null;
  }

  const articleById = new Map(articles.map((a) => [String(a.id), a]));
  const chosenFeatured = featuredId ? articleById.get(String(featuredId)) : undefined;
  const chosenSide = (sideIds || [])
    .map((id) => articleById.get(String(id)))
    .filter((a): a is NewsArticle => Boolean(a) && a?.id !== chosenFeatured?.id);

  const fallback = articles.filter(
    (a) =>
      a.id !== chosenFeatured?.id &&
      !chosenSide.some((selected) => String(selected.id) === String(a.id))
  );

  const featured = chosenFeatured || articles[0];
  const featuredTheme = getCategoryTheme(featured.category);
  const rest = [...chosenSide, ...fallback.filter((a) => String(a.id) !== String(featured.id))].slice(0, 3);

  return (
    <section id="news" className="py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="container">
        <ScrollReveal direction="up">
          <h2 className="section-title">Latest News</h2>
        </ScrollReveal>

        <div className="mt-6 sm:mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-6 sm:gap-8 lg:gap-10">
          {/* Featured story with image */}
          <ScrollReveal direction="up">
            <Link
              to={buildNewsPath(featured.title, featured.id)}
              className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
            >
              <article className="glass-card overflow-hidden flex flex-col h-full transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="relative aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] overflow-hidden bg-muted/40">
                  {getImageSrc(featured) ? (
                    <img
                      src={getImageSrc(featured)}
                      alt={featured.imageAlt || featured.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>
                <div className="p-4 sm:p-5 md:p-6 flex flex-col gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full ${featuredTheme.pillBg} ${featuredTheme.pillText} text-[11px] font-semibold uppercase tracking-[0.18em]`}
                  >
                    {featured.category}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-foreground leading-snug group-hover:text-accent transition-colors">
                    {featured.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                    {featured.excerpt}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-sans">
                    {featured.author && (
                      <span className="text-muted-foreground/90">{featured.author}</span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${featuredTheme.metaBg} ${featuredTheme.metaText}`}
                    >
                      {featured.date}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${featuredTheme.metaBg} ${featuredTheme.metaText}`}
                    >
                      {featured.readTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </ScrollReveal>

          {/* Side list of other stories (text only) */}
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
            {rest.map((article, index) => {
              const sideTheme = getCategoryTheme(article.category);
              return (
              <ScrollReveal key={article.title} delay={0.05 * index} direction="up">
                <Link
                  to={buildNewsPath(article.title, article.id)}
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                >
                  <article className="glass-card flex gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 min-h-[72px] sm:min-h-0 transition-transform duration-300 group-hover:-translate-y-0.5">
                    <div className="flex-1 flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full ${sideTheme.listBg} ${sideTheme.listText} text-[10px] font-semibold uppercase tracking-[0.16em]`}
                      >
                        {article.category}
                      </span>
                      <h4 className="font-serif text-[15px] md:text-[16px] text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {article.title}
                      </h4>
                      <p className="hidden md:block text-xs text-muted-foreground/90 font-sans line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-sans">
                        {article.author && (
                          <span className="text-muted-foreground/90">{article.author}</span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${sideTheme.metaBg} ${sideTheme.metaText}`}
                        >
                          {article.date}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${sideTheme.metaBg} ${sideTheme.metaText}`}
                        >
                          {article.readTime}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </ScrollReveal>
            );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
