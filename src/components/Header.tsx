import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import logo from "@/assets/logo-brainfeed.png";

const navItems = [
  { label: "Home", href: "#" },
  { label: "About Us", href: "#" },
  { label: "News", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Subscribe", href: "#" },
  { label: "Contact Us", href: "#" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card/95 backdrop-blur-lg border-b border-border/60 sticky top-0 z-50"
    >
      <div className="container flex items-center justify-between py-5">
        <a href="#" className="flex-shrink-0">
          <img src={logo} alt="Brainfeed Magazine" className="h-11" />
        </a>

        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="text-[13px] font-medium uppercase tracking-widest text-foreground/70 hover:text-accent transition-colors duration-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              {item.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="text-foreground/60 hover:text-accent transition-colors"
          >
            <Search className="h-[18px] w-[18px]" />
          </motion.button>
          <motion.a
            href="#"
            className="hidden sm:inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-accent/90 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Subscribe
          </motion.a>
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-border/60 bg-card overflow-hidden"
          >
            <div className="container py-6 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors py-3 border-b border-border/30 last:border-0"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
