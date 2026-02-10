import { useState } from "react";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
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
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between py-4">
        {/* Logo */}
        <a href="#" className="flex-shrink-0">
          <img src={logo} alt="Brainfeed Magazine" className="h-12" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-accent transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <button className="text-foreground hover:text-accent transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-foreground hover:text-accent transition-colors hidden sm:block">
            <User className="h-5 w-5" />
          </button>
          <button className="text-foreground hover:text-accent transition-colors hidden sm:block relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              0
            </span>
          </button>
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-card">
          <div className="container py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-accent transition-colors py-2 border-b border-border last:border-0"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
