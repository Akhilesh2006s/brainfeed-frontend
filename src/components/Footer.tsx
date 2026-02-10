import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import logo from "@/assets/logo-brainfeed.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={logo} alt="Brainfeed Magazine" className="h-10 brightness-200" />
            <p className="mt-4 text-sm leading-relaxed font-sans text-background/60">
              India's premier education magazine empowering educators, parents, and students since 2010.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><a href="#" className="hover:text-accent transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">News</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Subscribe</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif font-bold text-background mb-4">Categories</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><a href="#" className="hover:text-accent transition-colors">Education</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Technology</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Parenting</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Expert View</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Press Release</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-serif font-bold text-background mb-4">Connect With Us</h4>
            <div className="flex gap-3">
              <a href="#" className="hover:text-accent transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Youtube className="h-5 w-5" /></a>
              <a href="#" className="hover:text-accent transition-colors"><Mail className="h-5 w-5" /></a>
            </div>
            <p className="mt-4 text-sm font-sans text-background/60">
              admin@brainfeedmagazine.com
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 text-center text-xs text-background/40 font-sans">
          © {new Date().getFullYear()} Brainfeed Magazine. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
