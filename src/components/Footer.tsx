import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import logo from "@/assets/logo-brainfeed.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/70 pt-16 pb-8">
      <div className="container">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="md:col-span-1">
            <img src={logo} alt="Brainfeed Magazine" className="h-10 brightness-200" />
            <p className="mt-5 text-sm leading-[1.8] font-sans text-background/50">
              India's premier education magazine empowering educators, parents, and students since 2010.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-background text-lg mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm font-sans">
              {["Home", "About Us", "News", "Blog", "Subscribe"].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-accent transition-colors duration-300">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-background text-lg mb-5">Categories</h4>
            <ul className="space-y-3 text-sm font-sans">
              {["Education", "Technology", "Parenting", "Expert View", "Press Release"].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-accent transition-colors duration-300">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-background text-lg mb-5">Connect</h4>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="text-background/50 hover:text-accent transition-colors duration-300"
                  whileHover={{ scale: 1.2, y: -2 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            <p className="mt-5 text-sm font-sans text-background/40">
              admin@brainfeedmagazine.com
            </p>
          </div>
        </motion.div>

        <div className="mt-14 pt-6 border-t border-background/10 text-center text-xs text-background/30 font-sans tracking-wide">
          © {new Date().getFullYear()} Brainfeed Magazine. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
