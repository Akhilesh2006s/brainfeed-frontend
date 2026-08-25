import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/55qKRMnw401SpsX2.webp.jpg.jpeg";
import { useSiteSettings } from "@/context/SiteSettingsContext";


const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { settings } = useSiteSettings();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const hero = settings?.homeHero;
  const bg = hero?.backgroundImageUrl?.trim() || heroImg;
  const eyebrow = hero?.eyebrow || "13+ Years in Education • 40,000+ Schools";
  const title = hero?.title || "Today's Readers are";
  const titleAccent = hero?.titleAccent || "Tomorrow's Leaders";
  const subtitle1 =
    hero?.subtitle1 ||
    "India's leading education magazine, inspiring students, educators and schools through five specialised publications.";

  // Split the eyebrow on "•" so each stat can carry its own accent dot.
  const eyebrowParts = eyebrow
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden border-b border-border/60 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex items-center bg-[linear-gradient(115deg,#3a1663_0%,#2d1052_42%,#240b42_74%,#1c0733_100%)]"
    >
      {/* Soft violet glow behind the copy */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_85%_at_18%_50%,rgba(103,45,168,0.34),transparent_66%)]"
        aria-hidden
      />

      {/* Photo panel — full bleed on mobile, right half on desktop.
          On desktop the photo is masked (see .hero-photo-fade) rather than
          covered, so it dissolves into whatever purple is behind it. */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%] lg:w-[58%]" aria-hidden>
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-photo-fade"
          style={{ backgroundImage: `url(${bg})`, y: imageY, scale: imageScale }}
        />
        {/* Mobile has no mask, so it needs a flat scrim to keep the copy readable */}
        <div className="absolute inset-0 bg-[#22083c]/80 md:hidden" />
      </div>

      {/* Content */}
      {/* Full-bleed wrapper, not `container` — the capped/centered container
          leaves a wide dead margin on the left once the viewport passes 1280px. */}
      <div className="relative z-10 w-full py-12 sm:py-14 lg:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-[34rem] text-left"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
            {eyebrowParts.map((part, i) => (
              <span key={part} className="flex items-center gap-3">
                {i > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c35]" />}
                {part}
              </span>
            ))}
          </div>

          <div className="mt-4 h-px w-full max-w-[26rem] bg-gradient-to-r from-white/45 via-white/20 to-transparent" />

          <h1 className="mt-6 font-serif text-[2rem] leading-[1.1] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] text-white font-bold">
            {title}
            <br />
            <span className="text-[#ff5c35] italic font-serif">{titleAccent}</span>
            <span className="text-white">.</span>
          </h1>

          <p className="mt-5 text-[13px] sm:text-sm md:text-base text-white/85 font-sans leading-relaxed max-w-[28rem]">
            {subtitle1}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <motion.a
              href="/e-magazines"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center rounded-md bg-[#7326b5] text-white px-7 py-3.5 min-h-[48px] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] hover:bg-[#8734cc] transition-colors"
            >
              Explore Magazines
            </motion.a>
            <motion.a
              href="/news"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2.5 rounded-md border border-white/40 text-white px-7 py-3.5 min-h-[48px] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] hover:bg-white/10 transition-colors"
            >
              Read Latest Issue
              <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
