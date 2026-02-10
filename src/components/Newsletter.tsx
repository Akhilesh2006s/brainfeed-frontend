import { useState } from "react";
import { motion } from "framer-motion";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-accent text-[11px] font-semibold uppercase tracking-widest">Stay Informed</span>
          <h2 className="font-serif text-3xl lg:text-4xl text-primary-foreground mt-3">
            Get the Free Newsletter
          </h2>
          <p className="mt-4 text-primary-foreground/60 max-w-md mx-auto font-sans leading-relaxed">
            Subscribe to Brainfeed Magazine for curated news, expert insights, and the latest in education.
          </p>
        </motion.div>
        <motion.form
          className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          onSubmit={(e) => e.preventDefault()}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-5 py-3.5 text-sm bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/35 focus:outline-none focus:border-accent rounded-full font-sans transition-colors"
          />
          <motion.button
            type="submit"
            className="px-8 py-3.5 bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-accent/90 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Subscribe
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
};

export default Newsletter;
