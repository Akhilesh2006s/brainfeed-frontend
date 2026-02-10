import { motion } from "framer-motion";
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
    <section className="py-14 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">{title}</h2>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-10">
          <div className="lg:col-span-3">
            <ArticleCard
              image={featured.image}
              category={title}
              title={featured.title}
              date={featured.date}
              size="large"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {rest.map((article, i) => (
              <motion.article
                key={i}
                className="article-card group flex gap-5"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="overflow-hidden rounded-lg flex-shrink-0">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-32 h-24 object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="category-badge">{title}</span>
                  <h4 className="font-serif text-[15px] text-foreground leading-snug mt-1.5 hover:text-accent transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h4>
                  <time className="mt-2 text-xs text-muted-foreground/70 font-sans tracking-wide">{article.date}</time>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
