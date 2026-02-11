import { motion } from "framer-motion";
import heroImg from "@/assets/55qKRMnw401SpsX2.webp.jpg.jpeg";

const HeroSection = () => {
  return (
    <section className="relative border-b border-border/60 bg-[#f5f5f7] text-slate-900">
      <div className="container pt-8 md:pt-10 lg:pt-14 pb-6 md:pb-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr,2.4fr] gap-8 lg:gap-14 items-start">
          {/* Left: heading, description, CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-4 md:space-y-5 max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff5c35]">
              Since 2009 — Trusted by 40,000+ schools
            </p>

            <h1 className="font-serif text-[2rem] sm:text-[2.4rem] md:text-[2.8rem] lg:text-[3rem] leading-tight text-slate-900">
              Today&apos;s Readers are{" "}
              <span className="text-[#ff5c35]">Tomorrow&apos;s Leaders</span>.
            </h1>

            <p className="text-sm md:text-base text-slate-600 font-sans leading-relaxed">
              India&apos;s premier educational monthly—nurturing 200,000+ young minds with five
              specialized Brainfeed publications for every age group.
            </p>

            <div className="flex flex-wrap gap-3 pt-1 justify-center lg:justify-start">
              <motion.a
                href="#news"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff5c35] px-6 py-2.8 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-md"
              >
                Subscribe now
                <span className="text-base translate-y-[1px]">→</span>
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full bg-transparent text-[#ff5c35] px-6 py-2.8 text-xs font-semibold uppercase tracking-[0.22em] border border-[#ff5c35]/60 hover:bg-[#ff5c35]/5 transition-colors"
              >
                Explore magazines
              </motion.a>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] text-slate-500 font-sans">
                No login needed. Updated with every issue and every new Brainfeed edition.
              </p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-xs md:text-sm text-slate-600 font-sans">
                <div>
                  <p className="font-semibold text-slate-900">Since 2009</p>
                  <p className="mt-0.5">India&apos;s No.1 educational monthly</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">40,000+</p>
                  <p className="mt-0.5">schools associated with Brainfeed</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">5 editions</p>
                  <p className="mt-0.5">reaching 200,000+ young readers</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: hero image card (kids reading Brainfeed) */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="w-full mt-6 lg:mt-0 flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-sm md:max-w-[862px] lg:max-w-lg rounded-3xl bg-card shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-border/70 overflow-hidden">
              <div className="relative">
                <img
                  src={heroImg}
                  alt="Children enjoying Brainfeed magazine"
                  className="w-full h-56 sm:h-64 md:h-[560px] lg:h-80 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between gap-3 text-white">
                  <div className="max-w-xs">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">
                      Loved by young readers
                    </p>
                    <p className="mt-1 text-sm md:text-base font-semibold leading-snug">
                      4 out of 5 students say Brainfeed makes learning more fun.
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-[11px] text-white/80">
                    <span>3–16 years</span>
                    <span className="opacity-80">ages we publish for</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
