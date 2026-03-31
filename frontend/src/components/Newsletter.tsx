import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ScrollReveal from "./ScrollReveal";
import { buildApiUrl } from "@/lib/apiUrl";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!em) {
      toast.error("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl("/newsletter/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, source: "homepage" }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; alreadySubscribed?: boolean };
      if (!res.ok) throw new Error(j?.error || "Could not subscribe.");
      if (j.alreadySubscribed) {
        toast.success("You're already subscribed — thank you!");
      } else {
        toast.success("Thanks! You're subscribed to our newsletter.");
      }
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-primary relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container text-center relative z-10">
        <ScrollReveal direction="up">
          <span className="text-accent text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest">Stay Informed</span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary-foreground mt-3">
            Get the Free Newsletter
          </h2>
          <p className="mt-3 sm:mt-4 text-[13px] sm:text-base text-primary-foreground/60 max-w-md mx-auto font-sans leading-relaxed px-1">
            Subscribe to Brainfeed Magazine for curated news, expert insights, and the latest in education.
          </p>
        </ScrollReveal>
        <motion.form
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
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
            className="flex-1 min-h-[48px] px-4 sm:px-5 py-3.5 text-sm bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/35 focus:outline-none focus:border-accent rounded-full font-sans transition-colors"
          />
          <motion.button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] px-8 py-3.5 bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            whileHover={{ scale: submitting ? 1 : 1.03 }}
            whileTap={{ scale: submitting ? 1 : 0.97 }}
          >
            {submitting ? "…" : "Subscribe"}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
};

export default Newsletter;
