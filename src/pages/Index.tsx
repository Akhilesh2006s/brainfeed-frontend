import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LatestNews from "@/components/LatestNews";
import CategorySection from "@/components/CategorySection";
import MagazineSection from "@/components/MagazineSection";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

import news4 from "@/assets/news-4.jpg";
import news5 from "@/assets/news-5.jpg";
import news6 from "@/assets/news-6.jpg";
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";

const technologyArticles = [
  {
    image: news4,
    title: "How EdTech Is Reshaping Classrooms Across Rural India",
    date: "February 9, 2026",
  },
  {
    image: news2,
    title: "AI-Powered Learning Platforms See 300% Growth in School Adoption",
    date: "February 8, 2026",
  },
  {
    image: news3,
    title: "Digital Infrastructure in Schools: Government Announces ₹5,000 Crore Initiative",
    date: "February 7, 2026",
  },
];

const parentingArticles = [
  {
    image: news5,
    title: "Building Resilience: How Parents Can Support Children During Board Exam Season",
    date: "February 9, 2026",
  },
  {
    image: news1,
    title: "Expert Advice on Balancing Screen Time and Study Hours for School Students",
    date: "February 8, 2026",
  },
  {
    image: news6,
    title: "The Role of Emotional Intelligence in Modern Parenting and Child Development",
    date: "February 7, 2026",
  },
];

const expertViewArticles = [
  {
    image: news6,
    title: "NEP 2020 Implementation: Where Are We Now? An Expert Assessment",
    date: "February 9, 2026",
  },
  {
    image: news1,
    title: "The Future of Vocational Education in India: Insights from Leading Educators",
    date: "February 8, 2026",
  },
  {
    image: news4,
    title: "Inclusive Education: Best Practices from Schools That Are Getting It Right",
    date: "February 7, 2026",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main>
        <HeroSection />
        <LatestNews />
        <CategorySection title="Expert View" articles={expertViewArticles} />
        <MagazineSection />
        <CategorySection title="Technology" articles={technologyArticles} />
        <CategorySection title="Parenting" articles={parentingArticles} />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
