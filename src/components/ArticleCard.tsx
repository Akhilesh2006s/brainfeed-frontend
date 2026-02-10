import { motion } from "framer-motion";

interface ArticleCardProps {
  image: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  size?: "default" | "large";
}

const ArticleCard = ({ image, category, title, date, excerpt, size = "default" }: ArticleCardProps) => {
  return (
    <motion.article
      className="article-card group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="article-card-image">
        <img
          src={image}
          alt={title}
          className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${size === "large" ? "h-72" : "h-52"}`}
          loading="lazy"
        />
      </div>
      <div className="mt-4">
        <span className="category-badge">{category}</span>
        <h3 className={`font-serif text-foreground mt-2 leading-snug hover:text-accent transition-colors duration-300 ${
          size === "large" ? "text-xl" : "text-lg"
        }`}>
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2.5 text-sm text-muted-foreground line-clamp-2 font-sans leading-relaxed">{excerpt}</p>
        )}
        <time className="mt-3 text-xs text-muted-foreground/70 block font-sans tracking-wide">{date}</time>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
