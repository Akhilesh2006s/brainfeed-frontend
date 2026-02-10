import { motion } from "framer-motion";
import heroImg from "@/assets/hero-education.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[520px] lg:h-[620px]">
        <motion.img
          src={heroImg}
          alt="Featured article"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16">
          <div className="container max-w-4xl mx-0">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-[11px] font-semibold uppercase tracking-widest rounded-full mb-5"
            >
              Education
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary-foreground leading-[1.15] max-w-2xl"
            >
              Colonel Seema Mishra Becomes First Woman Principal at Uttar Pradesh Sainik School
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-5 text-primary-foreground/70 text-base lg:text-lg max-w-xl font-sans leading-relaxed"
            >
              Making history in Indian military education, Colonel Seema Mishra takes charge as the first woman to lead a Sainik School in Uttar Pradesh.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-6 flex items-center gap-4 text-primary-foreground/50 text-sm font-sans"
            >
              <span>February 10, 2026</span>
              <span className="w-1 h-1 rounded-full bg-primary-foreground/30" />
              <span>5 min read</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
