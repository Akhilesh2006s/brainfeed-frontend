import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, GraduationCap, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const TopBar = () => {
  const { settings } = useSiteSettings();
  const links =
    settings?.topBar?.links
      ?.filter((l) => l?.label && l?.url && l.label.toLowerCase() !== "school search") || [
      { label: "Michampsindia", url: "https://michampsindia.com/" },
      { label: "Higher Education Plus", url: "https://highereducationplus.com/" },
    ];

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
      className="bg-primary text-primary-foreground text-xs"
    >
      <div className="container flex items-center justify-between gap-3 py-1.5 sm:py-2">
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {links.map((l, i) => {
            const isHighlight =
              l.label.toLowerCase().includes("higher education plus") ||
              l.label.toLowerCase().includes("michampsindia");
            const Icon = l.label.toLowerCase().includes("higher education plus")
              ? GraduationCap
              : l.label.toLowerCase().includes("michampsindia")
              ? Sparkles
              : null;
            return (
              <span key={l.url} className="inline-flex items-center">
                {i > 0 && <span className="h-3 w-px bg-primary-foreground/25 mx-2" />}
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    isHighlight
                      ? "px-2 py-0.5 rounded-full bg-primary-foreground/10 text-white font-semibold hover:bg-primary-foreground/20"
                      : "top-bar-link"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span className="truncate">{l.label}</span>
                </a>
              </span>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3 ml-auto">
          {[Facebook, Twitter, Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
            <motion.a
              key={i}
              href={socialHref(i)}
              target="_blank"
              rel={i === 5 ? undefined : "noreferrer"}
              className="top-bar-link flex items-center justify-center"
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
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
