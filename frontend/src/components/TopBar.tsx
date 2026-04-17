import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { normalizeTopBarLinks } from "@/lib/topBarDefaults";

const TopBar = () => {
  const { settings } = useSiteSettings();
  const links = normalizeTopBarLinks(settings?.topBar?.links);

  const social = settings?.topBar?.social || {};
  const socialHref = (idx: number) =>
    idx === 0
      ? social.facebook || "https://www.facebook.com/brainfeededumag"
      : idx === 1
        ? social.twitter || "https://twitter.com/brainfeededumag"
        : idx === 2
          ? social.instagram || "https://www.instagram.com/brainfeededumag/"
          : idx === 3
            ? social.linkedin || "https://www.linkedin.com/in/brainfeededumag/"
            : idx === 4
              ? social.youtube || "https://www.youtube.com/@brainfeedmagazine"
              : `mailto:${social.email || "info@brainfeedmagazine.com"}`;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:block bg-primary text-primary-foreground text-xs"
    >
      <div className="container flex flex-col gap-1.5 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2">
        {/* Partner links: wrap on very small screens so all stay visible; each as a pill button */}
        <div className="flex min-w-0 w-full flex-1 items-center sm:min-w-[200px]">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
            {links.map((l, i) => (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="top-bar-link max-w-[150px] sm:max-w-[190px]"
              >
                <Sparkles className="mr-1.5 h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{l.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          {[Facebook, Twitter, Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
            <motion.a
              key={i}
              href={socialHref(i)}
              target="_blank"
              rel={i === 5 ? undefined : "noreferrer"}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground transition-colors"
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 380 }}
            >
              <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;
