import ArticleCard from "./ArticleCard";
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";

const articles = [
  {
    image: news1,
    category: "Education",
    title: "Colonel Seema Mishra Becomes First Woman Principal at Uttar Pradesh Sainik School",
    date: "February 10, 2026",
    excerpt: "A historic appointment that marks a new chapter in Indian military education.",
  },
  {
    image: news2,
    category: "News",
    title: "CBSE Directs Schools To Update Class 11, 12 Teachers' Data For On-Screen Marking 2026",
    date: "February 10, 2026",
    excerpt: "Schools must update their teacher databases ahead of the new marking system.",
  },
  {
    image: news3,
    category: "News",
    title: "Rashtriya Military Schools Admission 2026: Class 6, 9 Result, Interview Call Letter Released",
    date: "February 10, 2026",
    excerpt: "Results for entrance examinations and interview call letters are now available online.",
  },
];

const LatestNews = () => {
  return (
    <section className="py-12">
      <div className="container">
        <h2 className="section-title">Latest News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <ArticleCard key={i} {...article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
