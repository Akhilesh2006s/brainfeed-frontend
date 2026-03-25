import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { BookOpen, Users, School, Award, Sparkles, Heart, Target, Quote } from "lucide-react";
import mainCover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM.jpeg";
import primary2Cover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM (1).jpeg";
import primary1Cover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.30 AM (2).jpeg";
import juniorCover from "@/assets/WhatsApp Image 2026-02-10 at 10.48.31 AM.jpeg";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

const editions = [
  {
    title: "Brainfeed Magazine",
    subtitle: "The voice of educators",
    description:
      "Connects thousands of school leaders and educators with objective insights to see what's now and what's next. A platform for stakeholders to discuss issues and remedial measures from industry and policy perspectives, share inspirational stories, innovative ideas and best practices.",
    icon: Quote,
    accent: "from industry and policy perspectives",
  },
  {
    title: "Brainfeed High",
    subtitle: "Igniting young minds",
    description:
      "Ignites young minds and nurtures curiosity with content that raises questions and stimulates interest. Helps children improve intellectual and personal development, accelerate academic success, increase critical thinking skills and prepare for modern-day challenges through science, culture, environment, career and current affairs.",
    icon: Sparkles,
    accent: "regular reading",
  },
  {
    title: "Brainfeed Primary 2",
    subtitle: "Inspiring love for reading",
    description:
      "An eclectic mix for children aged 8–10, aligned with their growing independence and curiosity. Every month it brings wonders of the world, beauty of nature, truths of science and the magic of stories to educate and entertain in a fun and engaging way.",
    icon: BookOpen,
    accent: "fun and engaging",
  },
  {
    title: "Brainfeed Primary 1",
    subtitle: "Unlocking creativity",
    description:
      "Designed for children below 8 with multidisciplinary content: logical thinking, stories, art, craft, colours, shapes and play. Develops cognitive, social and emotional stimulation with values, facts, activities and brain teasers to build intellectual, social, ethical and emotional capacities.",
    icon: Heart,
    accent: "discovery space",
  },
  {
    title: "Brainfeed Junior",
    subtitle: "Where the conversation begins",
    description:
      "Stimulates early childhood learning during the foundational stage. Develops cognitive, fine motor, literacy and numeracy skills through everyday experiences. Colourful pages invite exploration of play, art, rhythm, rhyme and movement for early attempts at reading.",
    icon: Target,
    accent: "foundational stage",
  },
];

type AboutPage = {
  title: string;
  slug: string;
  content: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  aboutCovers?: {
    main?: string;
    primary2?: string;
    primary1?: string;
    junior?: string;
  };
};

const About = () => {
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    document.title = "Education Articles & Insights | Brainfeed Magazine";

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "description";
      document.head.appendChild(metaEl);
    }
    metaEl.content =
      "Explore expert articles, insights, and trends shaping the future of education and EdTech in India.";

    return () => {
      document.title = originalTitle;
      if (metaEl && originalDescription !== null && originalDescription !== undefined) {
        metaEl.content = originalDescription;
      }
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/pages/slug/about`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AboutPage | null) => {
        if (data) setAboutPage(data);
      })
      .catch(() => {
        // ignore, fall back to static copy
      });
  }, []);

  const aboutSettings = settings?.about || {};

  const heroEyebrow = aboutSettings.heroEyebrow || "Knowing Brainfeed";
  const heroTitle =
    aboutSettings.heroTitle ||
    "Empowering children in their journey of literacy, numeracy and beyond.";
  const heroBody =
    aboutSettings.heroBody ||
    "Since 2013 we have been working with schools, educators and childhood advocacy organisations to keep the reading habit alive among the growing minds that are the destiny of our nation tomorrow.";

  const stats = [
    { value: aboutSettings.stat1Value || "60,000+", label: aboutSettings.stat1Label || "Schools Reached", icon: School },
    {
      value: aboutSettings.stat2Value || "3 Lakh+",
      label: aboutSettings.stat2Label || "School Leaders & Educators",
      icon: Users,
    },
    {
      value: aboutSettings.stat3Value || "1,75,000",
      label: aboutSettings.stat3Label || "Subscribers",
      icon: BookOpen,
    },
    {
      value: aboutSettings.stat4Value || "45+",
      label: aboutSettings.stat4Label || "Educational Conferences",
      icon: Award,
    },
    {
      value: aboutSettings.stat5Value || "12,000+",
      label: aboutSettings.stat5Label || "Leaders Recognised",
      icon: Sparkles,
    },
  ];

  const conferencesBody =
    aboutSettings.conferencesBody ||
    "Our educational conferences and expos have seen active participation from 8,000+ educational leaders and 250+ leading brands. Since 2013 we have organised 45+ conferences — a space for school leaders and educators to share ideas, identify trends and network with peers.";

  const awardsBody =
    aboutSettings.awardsBody ||
    "Brainfeed has recognised the contribution of over 12,000 leaders, educators, and companies in the educational products and services segment, conferring them with respective awards for excellence and innovation.";

  const ctaTitle =
    aboutSettings.ctaTitle ||
    "Ten years and still counting — trusted by readers who swear by our objectivity and quality.";

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        {/* Hero with right image */}
        <section className="border-b border-border/60 bg-secondary/20">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2.5fr)] items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-3">
                  {heroEyebrow}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight">
                  {heroTitle}
                </h1>
                <p className="mt-5 text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
                  {heroBody}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="relative w-full h-full"
              >
                <div className="relative w-full max-w-xl ml-auto">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-border/70 bg-muted shadow-xl shadow-black/10">
                    <img
                      src={aboutSettings.heroImageUrl || aboutPage?.heroImageUrl || mainCover}
                      alt={aboutSettings.heroImageAlt || aboutPage?.heroImageAlt || "Brainfeed magazine covers"}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Intro block */}
        <section className="py-14 md:py-20 border-b border-border/50">
          <div className="container">
            <ScrollReveal direction="up" once>
              <div className="max-w-3xl mx-auto text-center">
                {aboutPage ? (
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none font-sans text-muted-foreground leading-relaxed [&_h2]:font-serif [&_h2]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: aboutPage.content }}
                  />
                ) : (
                  <>
                    <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
                      Brainfeed is an educational media house empowering children in
                      their journey of childhood, literacy and numeracy development —
                      and helping educators teach out-of-curriculum skills and
                      concepts.
                    </p>
                    <p className="mt-6 text-muted-foreground font-sans leading-relaxed">
                      Our children's editions ignite young minds and nurture
                      curiosity with content that raises questions and stimulates
                      interest. The educator edition connects thousands of school
                      leaders with objective insights to see what's now and next.
                    </p>
                  </>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 md:py-16 bg-primary text-primary-foreground">
          <div className="container">
            <ScrollReveal direction="up" once>
              <h2 className="font-serif text-2xl md:text-3xl text-center mb-10 md:mb-14">
                Our reach
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
              {stats.map((item, i) => (
                <ScrollReveal key={item.label} delay={i * 0.08} direction="up" once>
                  <div className="text-center group">
                    <item.icon className="h-8 w-8 mx-auto mb-3 text-accent opacity-90 group-hover:scale-110 transition-transform" />
                    <div className="font-serif text-2xl md:text-3xl font-semibold text-white">
                      {item.value}
                    </div>
                    <div className="text-sm text-primary-foreground/80 mt-1 font-sans">
                      {item.label}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Magazine editions */}
        <section className="py-14 md:py-20">
          <div className="container">
            <ScrollReveal direction="up" once>
              <h2 className="section-title">Our publications</h2>
              <p className="text-muted-foreground font-sans max-w-2xl mb-12">
                One educators' magazine and four children's magazines — each
                crafted for its audience.
              </p>
            </ScrollReveal>

            <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
              {editions.map((edition, i) => (
                <ScrollReveal
                  key={edition.title}
                  direction="up"
                  delay={0.05 * i}
                  once
                >
                  <article className="glass-card h-full flex flex-col overflow-hidden">
                    <div className="w-full aspect-[3/4] bg-secondary/40 flex items-center justify-center overflow-hidden">
                      {edition.title === "Brainfeed Magazine" ? (
                        <img
                          src={
                            aboutSettings.aboutCoverMain ||
                            aboutPage?.aboutCovers?.main ||
                            mainCover
                          }
                          alt="Brainfeed Magazine cover"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : edition.title === "Brainfeed Primary 2" ? (
                        <img
                          src={
                            aboutSettings.aboutCoverPrimary2 ||
                            aboutPage?.aboutCovers?.primary2 ||
                            primary2Cover
                          }
                          alt="Brainfeed Primary 2 magazine cover"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : edition.title === "Brainfeed Primary 1" ? (
                        <img
                          src={
                            aboutSettings.aboutCoverPrimary1 ||
                            aboutPage?.aboutCovers?.primary1 ||
                            primary1Cover
                          }
                          alt="Brainfeed Primary 1 magazine cover"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : edition.title === "Brainfeed Junior" ? (
                        <img
                          src={
                            aboutSettings.aboutCoverJunior ||
                            aboutPage?.aboutCovers?.junior ||
                            juniorCover
                          }
                          alt="Brainfeed Junior magazine cover"
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <div className="p-10">
                          <edition.icon className="h-14 w-14 md:h-16 md:w-16 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                        {edition.subtitle}
                      </span>
                      <h3 className="font-serif text-lg md:text-xl text-foreground mt-2">
                        {edition.title}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground font-sans leading-relaxed">
                        {edition.description}
                      </p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Conferences & awards */}
        <section className="py-14 md:py-20 bg-secondary/30 border-t border-border/50">
          <div className="container">
            <ScrollReveal direction="up" once>
              <h2 className="section-title">Conferences & recognition</h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-8">
              <ScrollReveal direction="up" delay={0.1} once>
                <div className="glass-card p-6 sm:p-8">
                  <Award className="h-10 w-10 text-accent mb-4" />
                  <h3 className="font-serif text-xl text-foreground">
                    Conferences & expos
                  </h3>
                  <p className="mt-3 text-muted-foreground font-sans leading-relaxed">
                    {conferencesBody}
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.15} once>
                <div className="glass-card p-6 sm:p-8">
                  <Sparkles className="h-10 w-10 text-accent mb-4" />
                  <h3 className="font-serif text-xl text-foreground">
                    Awards
                  </h3>
                  <p className="mt-3 text-muted-foreground font-sans leading-relaxed">
                    {awardsBody}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 border-t border-border/50">
          <div className="container">
            <ScrollReveal direction="up" once>
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                  {ctaTitle}
                </h2>
                <motion.a
                  href="/subscribe"
                  className="inline-flex items-center gap-2 mt-8 bg-accent text-accent-foreground px-8 py-4 text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-accent/90 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Explore Brainfeed
                  <span className="text-base">→</span>
                </motion.a>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
