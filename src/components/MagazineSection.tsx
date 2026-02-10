import { motion } from "framer-motion";
import magazineImg from "@/assets/magazine-cover.jpg";

const MagazineSection = () => {
  return (
    <section className="py-16 lg:py-20 bg-secondary/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Latest Magazine</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mt-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <img
                src={magazineImg}
                alt="Latest Brainfeed Magazine"
                className="rounded-xl shadow-2xl max-h-[420px] object-cover w-full"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/5" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="category-badge">Featured Issue</span>
            <h3 className="font-serif text-3xl lg:text-4xl text-foreground mt-3 leading-tight">
              India's Premier Education Magazine
            </h3>
            <p className="mt-5 text-muted-foreground leading-[1.8] font-sans">
              Brainfeed Magazine has been at the forefront of education journalism, bringing you expert insights, policy updates, and inspiring stories from across India's education landscape.
            </p>
            <p className="mt-3 text-muted-foreground leading-[1.8] font-sans">
              Each issue is crafted to empower educators, parents, and students with the knowledge they need.
            </p>
            <motion.a
              href="#"
              className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Subscribe Now
              <span className="text-base">→</span>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MagazineSection;
