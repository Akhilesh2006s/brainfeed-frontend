import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ShoppingCart, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo-brainfeed.png";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const newsCategories = [
  { label: "All News", href: "/news" },
  { label: "Education", href: "/news?category=education" },
  { label: "Policy", href: "/news?category=policy" },
  { label: "Parenting", href: "/news?category=parenting" },
  { label: "Technology", href: "/news?category=technology" },
  { label: "Expert View", href: "/news?category=expert-view" },
  { label: "Press Release", href: "/news?category=press-release" },
];

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "News", dropdown: newsCategories },
  { label: "Contact Us", href: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<{
    news?: boolean;
  }>({ news: false });
  const location = useLocation();
  const { itemCount } = useCart();
  const { user, logout, isLoading } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.replace(/#.*/, ""));

  const isSubActive = (href: string) => {
    const [path, query] = href.split("?");
    if (location.pathname !== path) return false;
    if (!query) {
      // Treat plain /news as active when there is no category filter
      return !location.search;
    }
    return location.search === "?" + query;
  };

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card/95 backdrop-blur-lg border-b border-border/60 sticky top-0 z-50"
    >
      <div className="container flex items-center justify-between gap-2 lg:gap-4 h-16 md:h-[72px] w-full max-w-full overflow-hidden">
        <Link to="/" className="flex-shrink-0 flex items-center h-full py-2 mr-2 lg:mr-6">
          <img src={logo} alt="Brainfeed Magazine" className="h-8 sm:h-9 md:h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center justify-center gap-3 xl:gap-5 flex-1 min-w-0 shrink">
          {navItems.map((item, i) => {
            if ("dropdown" in item && item.dropdown) {
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-[13px] xl:text-[14px] font-semibold uppercase tracking-[0.12em] xl:tracking-[0.14em] text-foreground/70 hover:text-accent transition-colors duration-300 inline-flex items-center gap-1 whitespace-nowrap focus:outline-none focus:ring-0 py-2 px-3 rounded-full hover:bg-accent/5"
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[220px] rounded-lg border-border shadow-lg py-0">
                      {item.dropdown.map((sub, idx) => (
                        <span key={sub.href}>
                          {idx > 0 && <DropdownMenuSeparator className="bg-border" />}
                          <DropdownMenuItem asChild>
                            <Link
                              to={sub.href}
                              className={`cursor-pointer text-[13px] font-medium uppercase tracking-wide py-2.5 px-3 transition-colors ${
                                isSubActive(sub.href)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          </DropdownMenuItem>
                        </span>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            }
            const href = (item as { label: string; href: string }).href;
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center">
                <Link
                  to={href}
                  className={`text-[13px] xl:text-[14px] font-semibold uppercase tracking-[0.12em] xl:tracking-[0.14em] transition-colors duration-300 whitespace-nowrap py-2 px-3 rounded-full ${
                    isActive(href)
                      ? "bg-accent/10 text-accent"
                      : "text-foreground/80 hover:text-accent hover:bg-accent/5"
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ml-2">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center shrink-0">
            <Link
              to="/cart"
              className="relative flex items-center justify-center p-1.5 rounded-full text-foreground/70 hover:text-accent hover:bg-muted/50 transition-colors"
              aria-label="View cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {itemCount}
                </span>
              )}
            </Link>
          </motion.div>
          {!isLoading && <div className="hidden sm:flex items-center gap-2" />}
          <Link
            to="/subscribe"
            className="hidden sm:inline-flex items-center justify-center h-8 xl:h-9 px-3 xl:px-4 rounded-full bg-accent text-accent-foreground border border-accent/80 text-[11px] xl:text-xs font-semibold uppercase tracking-wide hover:bg-accent/90 transition-colors whitespace-nowrap shrink-0"
          >
            Subscribe
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="lg:hidden text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            onClick={() => {
              const next = !mobileOpen;
              setMobileOpen(next);
              if (!next) setMobileDropdownOpen({ news: false });
            }}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-border/60 bg-card overflow-hidden relative z-50 max-h-[80vh] overflow-y-auto">
          <div className="container py-4 sm:py-5 flex flex-col gap-0">
            {navItems.map((item) => {
              if ("dropdown" in item && item.dropdown) {
                return (
                  <div key={item.label} className="border-b border-border/60">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileDropdownOpen((p) => ({
                          ...p,
                          news: item.label === "News" ? !p.news : p.news,
                        }))
                      }
                      className="w-full flex items-center justify-between py-3 pl-3 pr-4 touch-manipulation"
                      aria-expanded={mobileDropdownOpen.news ? "true" : "false"}
                    >
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          mobileDropdownOpen.news ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {item.label === "News" && mobileDropdownOpen.news && (
                      <div className="pb-3">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.href}
                            to={sub.href}
                            onClick={() => {
                              setMobileOpen(false);
                              setMobileDropdownOpen({ news: false });
                            }}
                            className={`text-sm font-medium py-2.5 pl-4 pr-3 flex items-center touch-manipulation transition-colors border-b border-border/50 last:border-b-0 ${
                              isSubActive(sub.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const href = (item as { label: string; href: string }).href;
              return (
                <Link
                  key={item.label}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-semibold uppercase tracking-[0.12em] py-3.5 sm:py-3 min-h-[48px] flex items-center border-b border-border/60 touch-manipulation px-3 rounded-md ${
                    isActive(href)
                      ? "bg-accent/10 text-accent"
                      : "text-foreground/80 hover:bg-accent/5 hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile-only Subscribe nav item */}
            <Link
              to="/subscribe"
              onClick={() => {
                setMobileOpen(false);
                setMobileDropdownOpen({ news: false });
              }}
              className={`text-sm font-semibold uppercase tracking-[0.12em] py-3.5 sm:py-3 min-h-[48px] flex items-center border-b border-border/60 touch-manipulation px-3 rounded-md ${
                isActive("/subscribe")
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/80 hover:bg-accent/5 hover:text-accent"
              }`}
            >
              Subscribe
            </Link>

            {!isLoading && user && (
              <div className="flex flex-col border-t border-border/60 pt-3 mt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-foreground/70 hover:text-accent py-3.5 pl-4 pr-3 flex items-center gap-2 touch-manipulation"
                >
                  <UserCircle className="h-5 w-5 shrink-0" />
                  Profile
                </Link>
                <span className="text-xs text-muted-foreground px-4 py-2">Hi, {user.name}</span>
                <Link
                  to="/"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="text-sm font-medium text-foreground/70 hover:text-accent py-3.5 pl-4 pr-3 touch-manipulation"
                >
                  Log out
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </motion.header>
  );
};

export default Header;
