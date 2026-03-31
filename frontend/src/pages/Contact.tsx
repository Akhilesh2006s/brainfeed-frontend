import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { MapPin, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import heroEducation from "@/assets/hero-education.jpg";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/** Google embeds that are zoomed in too far (high z) often look sparse; nudge zoom out for clearer context. */
function normalizeGoogleMapsEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("google.") || !u.pathname.includes("maps")) return url;
    const z = u.searchParams.get("z");
    if (!z) return url;
    const zi = parseInt(z, 10);
    if (Number.isFinite(zi) && zi > 18) {
      u.searchParams.set("z", "17");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

const Contact = () => {
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    document.title = "Contact Brainfeed Magazine | Get in Touch";

    let metaEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "description";
      document.head.appendChild(metaEl);
    }
    metaEl.content =
      "Contact Brainfeed Magazine for queries, advertising, and collaboration opportunities in education and EdTech.";

    return () => {
      document.title = originalTitle;
      if (metaEl && originalDescription !== null && originalDescription !== undefined) {
        metaEl.content = originalDescription;
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: in production you'd send to an API or mailto
    console.log("Contact form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contact = settings?.contact;
  const addressLines = contact?.addressLines?.length
    ? contact.addressLines
    : [
        "Kakani Edu Media Pvt Ltd",
        "Plot No: 47, Rd Number 4A, adjacent to Bose Edifice,",
        "Golden Tulip Estate, Raghavendra Colony, Hyderabad,",
        "Telangana 500084",
      ];
  const whatsapp = contact?.whatsapp || "918448737157";
  const phoneAlt = contact?.phoneAlt || "";
  const emails = contact?.emails?.length ? contact.emails : ["info@brainfeedmagazine.com", "kakani2406@gmail.com"];
  // Use ?? / trim only — do not use || here: cleared admin fields are "" and must stay hidden (not replaced by demo text).
  const regionTitle = String(contact?.regionTitle ?? "").trim();
  const regionName = String(contact?.regionName ?? "").trim();
  const regionWhatsapp = String(contact?.regionWhatsapp ?? "").trim();
  const regionEmail = String(contact?.regionEmail ?? "").trim();
  const hasRegionBlock = !!(regionTitle || regionName || regionWhatsapp || regionEmail);
  const mapUrl =
    contact?.mapUrl ||
    "https://www.google.com/maps?ll=17.473071,78.357614&z=16&t=m&hl=en&gl=IN&mapclient=embed&cid=16509507856910290038";
  const mapEmbedUrl =
    contact?.mapEmbedUrl || "https://www.google.com/maps?q=17.473071,78.357614&z=16&output=embed";
  const mapImageUrl = String(contact?.mapImageUrl ?? "").trim();
  const mapImageAlt = String(contact?.mapImageAlt ?? "").trim() || "Map showing our location";

  const mapEmbedUrlNormalized = useMemo(
    () => normalizeGoogleMapsEmbedUrl(mapEmbedUrl),
    [mapEmbedUrl],
  );

  const addressHtml = useMemo(() => addressLines.join("<br />"), [addressLines]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative min-h-[40vh] md:min-h-[45vh] flex items-end overflow-hidden border-b border-border/60">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroEducation})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          <div className="container relative z-10 w-full pb-12 pt-24 md:pb-16 md:pt-28">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground"
            >
              Contact Us
            </motion.h1>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-8">
                <ScrollReveal direction="up" once>
                  <h2 className="section-title">Contact Info</h2>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.1} once>
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">
                        Address
                      </p>
                      <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                        <span dangerouslySetInnerHTML={{ __html: addressHtml }} />
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.15} once>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <Phone className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">
                          WhatsApp
                        </p>
                        <p className="text-muted-foreground font-sans text-sm">
                          <a
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent transition-colors"
                          >
                            +{whatsapp}
                          </a>
                        </p>
                      </div>
                    </div>
                    {phoneAlt && (
                      <div className="flex gap-4">
                        <Phone className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">
                            Phone
                          </p>
                          <p className="text-muted-foreground font-sans text-sm">
                            <a href={`tel:${phoneAlt}`} className="hover:text-accent transition-colors">
                              {phoneAlt}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.2} once>
                  <div className="flex gap-4">
                    <Mail className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm uppercase tracking-wider mb-1">
                        Email
                      </p>
                      {emails.map((e) => (
                        <p key={e} className="text-muted-foreground font-sans text-sm mt-0.5">
                          <a href={`mailto:${e}`} className="hover:text-accent transition-colors break-all">
                            {e}
                          </a>
                        </p>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
                {hasRegionBlock && (
                  <ScrollReveal direction="up" delay={0.25} once>
                    <div className="pt-4 border-t border-border/50">
                      {regionTitle && (
                        <p className="font-semibold text-foreground text-sm uppercase tracking-wider mb-2">
                          {regionTitle}
                        </p>
                      )}
                      {regionName && (
                        <p className="text-muted-foreground font-sans text-sm">{regionName}</p>
                      )}
                      {regionWhatsapp && (
                        <p className="text-muted-foreground font-sans text-sm mt-0.5">
                          <a
                            href={`https://wa.me/${regionWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent transition-colors"
                          >
                            +{regionWhatsapp}
                          </a>
                        </p>
                      )}
                      {regionEmail && (
                        <p className="text-muted-foreground font-sans text-sm mt-0.5">
                          <a
                            href={`mailto:${regionEmail}`}
                            className="hover:text-accent transition-colors break-all"
                          >
                            {regionEmail}
                          </a>
                        </p>
                      )}
                    </div>
                  </ScrollReveal>
                )}
              </div>

              {/* Get In Touch form */}
              <div className="lg:col-span-3">
                <ScrollReveal direction="up" once>
                  <h2 className="section-title">Get In Touch</h2>
                  <p className="text-muted-foreground font-sans text-sm mb-8">
                    Send us a message and we&apos;ll get back to you as soon as we can.
                  </p>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.1} once>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-foreground font-medium">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Your full name"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          className="rounded-lg border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          Your Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="rounded-lg border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-foreground font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="Subject of your message"
                        value={formData.subject}
                        onChange={handleChange}
                        className="rounded-lg border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-foreground font-medium">
                        Your Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Write your message here..."
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="rounded-lg border-border min-h-[120px]"
                      />
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg px-8 py-3 text-sm font-semibold uppercase tracking-widest"
                      >
                        Send Message
                      </Button>
                    </motion.div>
                  </form>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="border-t border-border/50">
          <ScrollReveal direction="up" once>
            <div className="container flex flex-wrap items-baseline justify-between gap-2 py-3">
              <h2 className="section-title mb-0">Find Us</h2>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline font-medium"
              >
                View in Google Maps →
              </a>
            </div>
          </ScrollReveal>
          <div className="container pb-10 md:pb-14">
            <div className="w-full min-h-[260px] max-h-[min(56vh,520px)] aspect-[16/10] sm:aspect-[2/1] md:aspect-[21/9] rounded-xl overflow-hidden border border-border/50 bg-muted/40 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]">
              {mapImageUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full min-h-[260px] relative group"
                >
                  <img
                    src={mapImageUrl}
                    alt={mapImageAlt}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="sr-only">Open location in Google Maps</span>
                </a>
              ) : (
                <iframe
                  title="Brainfeed Magazine location"
                  src={mapEmbedUrlNormalized}
                  width="100%"
                  height="100%"
                  className="block w-full h-full min-h-[260px] border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
