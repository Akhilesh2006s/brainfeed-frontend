import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";

const TopBar = () => {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <a href="#" className="top-bar-link">MI Champs India</a>
          <span className="text-primary-foreground/30">|</span>
          <a href="#" className="top-bar-link">Higher Education Plus</a>
          <span className="text-primary-foreground/30">|</span>
          <a href="#" className="top-bar-link">School Search</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="top-bar-link"><Facebook className="h-3.5 w-3.5" /></a>
          <a href="#" className="top-bar-link"><Twitter className="h-3.5 w-3.5" /></a>
          <a href="#" className="top-bar-link"><Instagram className="h-3.5 w-3.5" /></a>
          <a href="#" className="top-bar-link"><Linkedin className="h-3.5 w-3.5" /></a>
          <a href="#" className="top-bar-link"><Youtube className="h-3.5 w-3.5" /></a>
          <a href="#" className="top-bar-link"><Mail className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
