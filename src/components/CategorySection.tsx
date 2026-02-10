import ArticleCard from "./ArticleCard";

interface CategoryArticle {
  image: string;
  title: string;
  date: string;
}

interface CategorySectionProps {
  title: string;
  articles: CategoryArticle[];
}

const CategorySection = ({ title, articles }: CategorySectionProps) => {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <section className="py-10">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured article */}
          <ArticleCard
            image={featured.image}
            category={title}
            title={featured.title}
            date={featured.date}
            size="large"
          />

          {/* Sidebar list */}
          <div className="flex flex-col gap-5">
            {rest.map((article, i) => (
              <article key={i} className="article-card flex gap-4">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-28 h-20 object-cover rounded-sm flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex flex-col justify-center">
                  <h4 className="font-serif text-sm font-bold text-foreground leading-snug hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <time className="mt-1 text-xs text-muted-foreground font-sans">{article.date}</time>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
