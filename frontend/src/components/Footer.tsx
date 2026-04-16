import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import logo from "@/assets/logo-brainfeed.png";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const Footer = () => {
  const { settings } = useSiteSettings();
  const description =
    settings?.footer?.description ||
    "India's premier education magazine empowering educators, parents, and students since 2010.";
  const footerEmail = settings?.footer?.email || "admin@brainfeedmagazine.com";
  const social = settings?.footer?.social || {};
  const hrefFor = (i: number) =>
    i === 0
      ? social.facebook || "https://www.facebook.com/brainfeededumag"
      : i === 1
      ? social.twitter || "https://twitter.com/brainfeededumag"
      : i === 2
      ? social.instagram || "https://www.instagram.com/brainfeededumag/"
      : i === 3
      ? social.linkedin || "https://www.linkedin.com/in/brainfeededumag/"
      : i === 4
      ? social.youtube || "https://www.youtube.com/@brainfeedmagazine"
      : `mailto:${social.email || "info@brainfeedmagazine.com"}`;

  return (
    <footer className="bg-foreground text-background/70 pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
      <div className="container">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="sm:col-span-2 md:col-span-1">
            <a href="/" className="inline-flex items-center">
              <img
                src={logo}
                alt="Brainfeed Magazine"
                className="h-8 sm:h-9 md:h-10 w-auto object-contain"
              />
            </a>
            <p className="mt-4 sm:mt-5 text-[13px] sm:text-sm leading-[1.8] font-sans text-background/50">
              {description}
            </p>
            <div className="mt-5 flex items-center gap-3 sm:gap-4">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href={hrefFor(i)}
                  target={i === 5 ? undefined : "_blank"}
                  rel={i === 5 ? undefined : "noreferrer"}
                  className="text-background/60 hover:text-accent transition-colors duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.2, y: -2 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            <a
              href={`mailto:${footerEmail.trim()}`}
              className="mt-4 block text-[13px] sm:text-sm font-sans text-background/45 break-all hover:text-accent transition-colors duration-300 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-sm"
            >
              {footerEmail}
            </a>
          </div>

          <div>
            <h4 className="font-serif text-background text-base sm:text-lg mb-4 sm:mb-5">Quick Links</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm font-sans">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "News", href: "/news" },
                { label: "Gallery", href: "/gallery" },
                { label: "E-Magazines", href: "/e-magazines" },
                { label: "Subscribe", href: "/subscribe" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-accent transition-colors duration-300">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-background text-base sm:text-lg mb-4 sm:mb-5">Useful Links</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm font-sans">
              <li><a href="/cancellation-refund-policy" className="hover:text-accent transition-colors duration-300">Cancellation & Refund Policy</a></li>
              <li><a href="/privacy-policy" className="hover:text-accent transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="/shipping-policy" className="hover:text-accent transition-colors duration-300">Shipping Policy</a></li>
              <li><a href="/terms-and-conditions" className="hover:text-accent transition-colors duration-300">Terms and Conditions</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-background text-base sm:text-lg mb-4 sm:mb-5">Categories</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm font-sans">
              {[
                { label: "All News", href: "/news" },
                { label: "Education", href: "/news?category=education" },
                { label: "Policy", href: "/news?category=policy" },
                { label: "Parenting", href: "/news?category=parenting" },
                { label: "Expert View", href: "/news?category=expert-view" },
                { label: "Technology", href: "/news?category=technology" },
                { label: "Press Release", href: "/news?category=press-release" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-accent transition-colors duration-300">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <div className="mt-10 sm:mt-14 pt-4 sm:pt-6 border-t border-background/10 text-center text-[11px] sm:text-xs text-background/30 font-sans tracking-wide px-2">
          © {new Date().getFullYear()} Brainfeed Magazine. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
