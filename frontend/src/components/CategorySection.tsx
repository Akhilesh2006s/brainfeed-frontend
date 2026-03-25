import ScrollReveal from "./ScrollReveal";
import { Link } from "react-router-dom";
import { buildNewsPath } from "@/lib/seo";
import { getCategoryTheme } from "@/lib/categoryTheme";

interface CategoryArticle {
  id: string | number;
  image?: string;
  title: string;
  date: string;
  tag?: string;
  author?: string;
  readTime?: string;
}

interface CategorySectionProps {
  title: string;
  articles: CategoryArticle[];
}

const CategorySection = ({ title, articles }: CategorySectionProps) => {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  const featuredTag = featured.tag ?? title;
  const featuredTheme = getCategoryTheme(featuredTag);

  return (
    <section className="py-5 sm:py-6 md:py-7 lg:py-8">
      <div className="container">
        <ScrollReveal direction="up">
          <h2 className="section-title">{title}</h2>
        </ScrollReveal>

        <div className="mt-3 sm:mt-4 md:mt-5 grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-4 sm:gap-5 md:gap-6">
          {/* Featured story with image */}
          <ScrollReveal direction="up">
            <Link
              to={buildNewsPath(featured.title, featured.id)}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
            >
              <article className="glass-card overflow-hidden flex flex-col h-full">
                <div className="relative aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] overflow-hidden bg-muted/40">
                  {featured.image ? (
                    <img
                      src={featured.image}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>
                <div className="p-4 sm:p-5 md:p-6 flex flex-col gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full ${featuredTheme.pillBg} ${featuredTheme.pillText} text-xs font-semibold uppercase tracking-[0.18em]`}
                  >
                    {featuredTag}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-foreground leading-snug">
                    {featured.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-sans">
                    {featured.author && <span className="text-muted-foreground/90">{featured.author}</span>}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${featuredTheme.metaBg} ${featuredTheme.metaText}`}
                    >
                      {featured.date}
                    </span>
                    {featured.readTime && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${featuredTheme.metaBg} ${featuredTheme.metaText}`}
                      >
                        {featured.readTime}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          </ScrollReveal>

          {/* Side list of other stories (text only) */}
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
            {rest.map((article, index) => {
              const tag = article.tag ?? title;
              const theme = getCategoryTheme(tag);
              return (
                <ScrollReveal key={article.title} delay={0.05 * index} direction="up">
                  <Link
                    to={buildNewsPath(article.title, article.id)}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                  >
                    <article className="glass-card flex gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 min-h-[72px] sm:min-h-0">
                      <div className="flex-1 flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full ${theme.listBg} ${theme.listText} text-xs font-semibold uppercase tracking-[0.16em]`}
                        >
                          {tag}
                        </span>
                        <h4 className="font-serif text-[15px] md:text-[16px] text-foreground leading-snug line-clamp-2">
                          {article.title}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-sans">
                          {article.author && <span className="text-muted-foreground/90">{article.author}</span>}
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${theme.metaBg} ${theme.metaText}`}
                          >
                            {article.date}
                          </span>
                          {article.readTime && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${theme.metaBg} ${theme.metaText}`}
                            >
                              {article.readTime}
                            </span>
                          )}
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

export default CategorySection;
