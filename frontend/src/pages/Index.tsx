import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LatestNews from "@/components/LatestNews";
import CategorySection from "@/components/CategorySection";
import MagazineSection from "@/components/MagazineSection";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type NewsArticle = {
  id: string | number;
  imageUrl?: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
};

const Index = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    document.title = "Brainfeed Magazine | Education News & EdTech Updates India";

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "description";
      document.head.appendChild(metaEl);
    }
    metaEl.content =
      "Stay updated with the latest education news, CBSE results, EdTech events, and school updates across India with Brainfeed Magazine.";

    return () => {
      document.title = originalTitle;
      if (metaEl && originalDescription !== null && originalDescription !== undefined) {
        metaEl.content = originalDescription;
      }
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/articles`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: NewsArticle[]) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
  }, []);

  const toCategoryArticle = (a: NewsArticle) => ({
    id: a.id,
    image: a.imageUrl,
    title: a.title,
    date: a.date,
    tag: a.category,
    readTime: a.readTime,
  });

  const articleById = new Map(articles.map((a) => [String(a.id), a]));
  const pickByIds = (ids: string[] | undefined, fallback: NewsArticle[]) => {
    const selected = (ids || [])
      .map((id) => articleById.get(String(id)))
      .filter((a): a is NewsArticle => Boolean(a));
    return (selected.length ? selected : fallback).slice(0, 4).map(toCategoryArticle);
  };

  const homeLayout = settings?.homeLayout;

  const expertViewArticles = pickByIds(
    homeLayout?.expertViewIds,
    articles.filter((a) => a.category === "Expert View")
  );
  const technologyArticles = pickByIds(
    homeLayout?.technologyIds,
    articles.filter((a) => a.category === "Technology")
  );
  const parentingArticles = pickByIds(
    homeLayout?.parentingIds,
    articles.filter((a) => a.category === "Parenting")
  );
  const editorPicks = pickByIds(homeLayout?.editorsPickIds, articles);
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main>
        <HeroSection />
        <LatestNews
          articles={articles}
          featuredId={homeLayout?.latestNewsFeaturedId}
          sideIds={homeLayout?.latestNewsSideIds}
        />
        <div className="border-t border-border/50">
          <CategorySection title="Expert View" articles={expertViewArticles} />
        </div>
        <div className="border-t border-border/50">
          <CategorySection title="Editor’s Picks" articles={editorPicks} />
        </div>
        <div className="border-t border-border/50">
          <CategorySection title="Technology" articles={technologyArticles} />
        </div>
        <div className="border-t border-border/50">
          <CategorySection title="Parenting" articles={parentingArticles} />
        </div>
        <MagazineSection magazineIds={homeLayout?.latestMagazineIds} />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
