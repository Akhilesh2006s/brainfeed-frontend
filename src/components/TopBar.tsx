import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";

const TopBar = () => {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-primary text-primary-foreground"
    >
      <div className="container flex items-center justify-between py-2.5">
        <div className="hidden md:flex items-center gap-5">
          <a href="#" className="top-bar-link">MI Champs India</a>
          <span className="text-primary-foreground/20">·</span>
          <a href="#" className="top-bar-link">Higher Education Plus</a>
          <span className="text-primary-foreground/20">·</span>
          <a href="#" className="top-bar-link">School Search</a>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {[Facebook, Twitter, Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
            <motion.a
              key={i}
              href="#"
              className="top-bar-link"
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="h-3.5 w-3.5" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;
