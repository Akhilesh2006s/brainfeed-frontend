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
    <article className="article-card">
      <div className="article-card-image rounded-sm">
        <img
          src={image}
          alt={title}
          className={`w-full object-cover ${size === "large" ? "h-64" : "h-48"}`}
          loading="lazy"
        />
      </div>
      <div className="mt-3">
        <span className="category-badge">{category}</span>
        <h3 className={`font-serif font-bold text-foreground mt-1 leading-snug hover:text-accent transition-colors ${
          size === "large" ? "text-xl" : "text-base"
        }`}>
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-sans">{excerpt}</p>
        )}
        <time className="mt-2 text-xs text-muted-foreground block font-sans">{date}</time>
      </div>
    </article>
  );
};

export default ArticleCard;
