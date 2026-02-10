import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-16 bg-primary">
      <div className="container text-center">
        <h2 className="font-serif text-3xl font-bold text-primary-foreground">
          Get the Free Newsletter
        </h2>
        <p className="mt-3 text-primary-foreground/70 max-w-lg mx-auto font-sans">
          Subscribe to Brainfeed Magazine for top news, trends, and analysis in education.
        </p>
        <form
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 text-sm bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent font-sans"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-accent-foreground text-sm font-semibold uppercase tracking-wide hover:bg-accent/90 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
