import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildApiUrl } from "@/lib/apiUrl";

export type SiteSettings = {
  homeHero?: {
    eyebrow?: string;
    title?: string;
    titleAccent?: string;
    subtitle1?: string;
    backgroundImageUrl?: string;
  };
  homeLayout?: {
    latestNewsFeaturedId?: string;
    latestNewsSideIds?: string[];
    expertViewIds?: string[];
    editorsPickIds?: string[];
    technologyIds?: string[];
    parentingIds?: string[];
    latestMagazineIds?: string[];
  };
  topBar?: {
    links?: { label: string; url: string }[];
    social?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
      email?: string;
    };
  };
  footer?: {
    description?: string;
    email?: string;
    social?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
      email?: string;
    };
  };
  contact?: {
    addressLines?: string[];
    whatsapp?: string;
    phoneAlt?: string;
    emails?: string[];
    regionTitle?: string;
    regionName?: string;
    regionWhatsapp?: string;
    regionEmail?: string;
    mapUrl?: string;
    mapEmbedUrl?: string;
  };
  about?: {
    heroEyebrow?: string;
    heroTitle?: string;
    heroBody?: string;
    heroImageUrl?: string;
    heroImageAlt?: string;
    aboutCoverMain?: string;
    aboutCoverPrimary2?: string;
    aboutCoverPrimary1?: string;
    aboutCoverJunior?: string;
    stat1Value?: string;
    stat1Label?: string;
    stat2Value?: string;
    stat2Label?: string;
    stat3Value?: string;
    stat3Label?: string;
    stat4Value?: string;
    stat4Label?: string;
    stat5Value?: string;
    stat5Label?: string;
    conferencesBody?: string;
    awardsBody?: string;
    ctaTitle?: string;
  };
};

type SiteSettingsContextValue = {
  settings: SiteSettings | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch(buildApiUrl("/site-settings"));
      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch {
      // Keep defaults in UI when API fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ settings, isLoading, refresh }), [settings, isLoading]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
};

