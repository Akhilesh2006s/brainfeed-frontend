import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DEFAULT_TOP_BAR_LINKS } from "@/lib/topBarDefaults";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type Settings = {
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
    social?: { facebook?: string; twitter?: string; instagram?: string; linkedin?: string; youtube?: string; email?: string };
  };
  footer?: {
    description?: string;
    email?: string;
    social?: { facebook?: string; twitter?: string; instagram?: string; linkedin?: string; youtube?: string; email?: string };
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
    mapImageUrl?: string;
    mapImageAlt?: string;
  };
  about?: {
    heroEyebrow?: string;
    heroTitle?: string;
    heroBody?: string;
    heroImageUrl?: string;
    heroImageAlt?: string;
    aboutCoverMain?: string;
    aboutCoverHigh?: string;
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

type NewsOption = {
  id: string;
  title: string;
  category: string;
};

/** Parse admin textarea: one link per line, first `|` separates label and URL. */
function parseTopBarLinksText(text: string): { label: string; url: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((ln) => {
      const pipe = ln.indexOf("|");
      if (pipe === -1) return { label: ln, url: "" };
      return { label: ln.slice(0, pipe).trim(), url: ln.slice(pipe + 1).trim() };
    })
    .filter((l) => l.label && l.url);
}

function topBarLinksToText(links: { label: string; url: string }[] | undefined): string {
  return (links || []).map((l) => `${l.label}|${l.url}`).join("\n");
}

const LATEST_MAGAZINE_OPTIONS = [
  { id: "main", label: "Brainfeed Magazine" },
  { id: "primary-i", label: "Brainfeed Primary I" },
  { id: "primary-ii", label: "Brainfeed Primary II" },
  { id: "junior", label: "Brainfeed Junior" },
  { id: "high", label: "Brainfeed High" },
];

/** Pad saved id list to 5 slots for the admin UI (order = home page left → right). */
function latestMagazineIdsToSlots(ids: string[] | undefined): [string, string, string, string, string] {
  const a = [...(ids || [])];
  while (a.length < 5) a.push("");
  return a.slice(0, 5) as [string, string, string, string, string];
}

const AdminSiteSettings = () => {
  const { token, isAdmin } = useAdmin();
  const { refresh: refreshPublicSiteSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Settings>({});
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [uploadingContactMap, setUploadingContactMap] = useState(false);
  const [aboutUploadKey, setAboutUploadKey] = useState<
    | "heroImageUrl"
    | "aboutCoverMain"
    | "aboutCoverHigh"
    | "aboutCoverPrimary2"
    | "aboutCoverPrimary1"
    | "aboutCoverJunior"
  >("heroImageUrl");
  const [section, setSection] = useState<"home" | "topbar" | "footer" | "about" | "contact">("home");
  const [newsOptions, setNewsOptions] = useState<NewsOption[]>([]);
  const [topLinksDraft, setTopLinksDraft] = useState("");

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/site-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json().then((j) => ({ ok: res.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j?.error || "Failed to load settings");
        setData(j || {});
      })
      .catch((e) => toast.error(e?.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch(`${API_BASE}/api/admin/posts?type=news&status=published`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: any[]) => {
        const mapped = (Array.isArray(rows) ? rows : []).map((row) => ({
          id: String(row?._id || ""),
          title: String(row?.title || "").trim(),
          category: String(row?.category || "").trim(),
        }));
        setNewsOptions(mapped.filter((n) => n.id && n.title));
      })
      .catch(() => setNewsOptions([]));
  }, [token, isAdmin]);

  useEffect(() => {
    if (loading) return;
    const links = data.topBar?.links?.length ? data.topBar.links : [...DEFAULT_TOP_BAR_LINKS];
    setTopLinksDraft(topBarLinksToText(links));
  }, [loading, data.topBar?.links]);

  const addressText = useMemo(() => (data.contact?.addressLines || []).join("\n"), [data.contact?.addressLines]);
  const emailsText = useMemo(() => (data.contact?.emails || []).join("\n"), [data.contact?.emails]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const parsed = parseTopBarLinksText(topLinksDraft);
      const existing = data.topBar?.links || [];
      const topBarLinks =
        parsed.length > 0
          ? parsed
          : existing.length > 0
            ? existing
            : [...DEFAULT_TOP_BAR_LINKS];
      const payload = {
        ...data,
        topBar: { ...(data.topBar || {}), links: topBarLinks },
      };
      const res = await fetch(`${API_BASE}/api/admin/site-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to save");
      setData(j || {});
      const savedLinks = j?.topBar?.links?.length ? j.topBar.links : [...DEFAULT_TOP_BAR_LINKS];
      setTopLinksDraft(topBarLinksToText(savedLinks));
      await refreshPublicSiteSettings();
      toast.success("Site settings saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const readMultiSelectValues = (select: HTMLSelectElement) =>
    Array.from(select.selectedOptions).map((o) => o.value).filter(Boolean);

  const setHomeLayout = (patch: Partial<NonNullable<Settings["homeLayout"]>>) => {
    setData((p) => ({
      ...p,
      homeLayout: { ...(p.homeLayout || {}), ...patch },
    }));
  };

  const magazineSlots = useMemo(
    () => latestMagazineIdsToSlots(data.homeLayout?.latestMagazineIds),
    [data.homeLayout?.latestMagazineIds],
  );

  const setMagazineSlot = (index: number, value: string) => {
    const trimmed = value.trim();
    setData((p) => {
      const slots = latestMagazineIdsToSlots(p.homeLayout?.latestMagazineIds);
      const next = [...slots] as [string, string, string, string, string];
      if (trimmed) {
        for (let i = 0; i < next.length; i++) {
          if (i !== index && next[i] === trimmed) next[i] = "";
        }
      }
      next[index] = trimmed;
      return {
        ...p,
        homeLayout: { ...(p.homeLayout || {}), latestMagazineIds: next },
      };
    });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-foreground">Site settings</h1>
        <p className="text-sm text-muted-foreground max-w-xl">Only Admin users can edit site settings.</p>
      </div>
    );
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl text-foreground">Site settings</h1>
        <p className="text-sm text-muted-foreground">
          Choose a section below (Home hero, Top bar, Footer, About, or Contact) to edit it separately.
        </p>
        <div className="mt-3 inline-flex flex-wrap gap-2 rounded-full bg-muted/60 p-1">
          {[
            { id: "home", label: "Home hero" },
            { id: "topbar", label: "Top bar" },
            { id: "footer", label: "Footer" },
            { id: "about", label: "About page" },
            { id: "contact", label: "Contact page" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                section === (s.id as any)
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-foreground/70 border-transparent hover:bg-card/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {section === "home" && (
      <section className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 space-y-4">
        <h2 className="font-serif text-lg text-foreground">Home page hero</h2>
        <div className="space-y-2">
          <Label>Eyebrow</Label>
          <Input
            value={data.homeHero?.eyebrow || ""}
            onChange={(e) => setData((p) => ({ ...p, homeHero: { ...(p.homeHero || {}), eyebrow: e.target.value } }))}
            className="h-11"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={data.homeHero?.title || ""}
              onChange={(e) => setData((p) => ({ ...p, homeHero: { ...(p.homeHero || {}), title: e.target.value } }))}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Accent title</Label>
            <Input
              value={data.homeHero?.titleAccent || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, homeHero: { ...(p.homeHero || {}), titleAccent: e.target.value } }))
              }
              className="h-11"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Subtitle 1</Label>
          <Textarea
            value={data.homeHero?.subtitle1 || ""}
            onChange={(e) => setData((p) => ({ ...p, homeHero: { ...(p.homeHero || {}), subtitle1: e.target.value } }))}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label>Hero background image</Label>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={uploadingHero}
              onClick={() => document.getElementById("hero-bg-upload-input")?.click()}
            >
              {uploadingHero ? "Uploading…" : "Upload image"}
            </Button>
            <Input
              id="hero-bg-upload-input"
              type="file"
              accept="image/*"
              disabled={uploadingHero}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !token) return;
                setUploadingHero(true);
                try {
                  const form = new FormData();
                  form.append("image", file);
                  const res = await fetch(`${API_BASE}/api/admin/site-settings/hero-image`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: form,
                  });
                  const j = await res.json();
                  if (!res.ok) throw new Error(j?.error || "Upload failed");
                  if (j.url) {
                    setData((p) => ({
                      ...p,
                      homeHero: { ...(p.homeHero || {}), backgroundImageUrl: j.url },
                    }));
                    toast.success("Hero image uploaded.");
                  }
                } catch (err: any) {
                  toast.error(err?.message || "Failed to upload hero image.");
                } finally {
                  setUploadingHero(false);
                  e.target.value = "";
                }
              }}
            />
            {data.homeHero?.backgroundImageUrl && (
              <p className="truncate text-xs text-muted-foreground">
                Current: {data.homeHero.backgroundImageUrl}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <h3 className="font-serif text-base text-foreground">Home page content selection</h3>
          <p className="text-xs text-muted-foreground">
            Choose exactly which articles appear in each home section and which magazines appear in Latest Magazines.
          </p>

          <div className="space-y-2">
            <Label>Latest News — Featured article (big card)</Label>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={data.homeLayout?.latestNewsFeaturedId || ""}
              onChange={(e) => setHomeLayout({ latestNewsFeaturedId: e.target.value })}
            >
              <option value="">Auto (latest)</option>
              {newsOptions.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.category})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Latest News — Side articles (up to 3)</Label>
            <select
              multiple
              className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={data.homeLayout?.latestNewsSideIds || []}
              onChange={(e) => setHomeLayout({ latestNewsSideIds: readMultiSelectValues(e.currentTarget).slice(0, 3) })}
            >
              {newsOptions.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Expert View section articles (up to 4)</Label>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={data.homeLayout?.expertViewIds || []}
                onChange={(e) => setHomeLayout({ expertViewIds: readMultiSelectValues(e.currentTarget).slice(0, 4) })}
              >
                {newsOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Editor’s Picks section articles (up to 4)</Label>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={data.homeLayout?.editorsPickIds || []}
                onChange={(e) => setHomeLayout({ editorsPickIds: readMultiSelectValues(e.currentTarget).slice(0, 4) })}
              >
                {newsOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Technology section articles (up to 4)</Label>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={data.homeLayout?.technologyIds || []}
                onChange={(e) => setHomeLayout({ technologyIds: readMultiSelectValues(e.currentTarget).slice(0, 4) })}
              >
                {newsOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Parenting section articles (up to 4)</Label>
              <select
                multiple
                className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={data.homeLayout?.parentingIds || []}
                onChange={(e) => setHomeLayout({ parentingIds: readMultiSelectValues(e.currentTarget).slice(0, 4) })}
              >
                {newsOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Latest Magazines section (up to 5, order left → right)</Label>
            <p className="text-xs text-muted-foreground">
              Position 1 is the first card on the left on the home page, then 2–5. Choose &ldquo;— Skip —&rdquo; to leave a slot empty. No Ctrl/Cmd key needed.
            </p>
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-xs font-medium text-muted-foreground shrink-0 w-full sm:w-28">
                    Position {i + 1}
                  </span>
                  <select
                    className="h-10 w-full flex-1 rounded-md border border-border bg-background px-3 text-sm"
                    value={magazineSlots[i] || ""}
                    onChange={(e) => setMagazineSlot(i, e.target.value)}
                  >
                    <option value="">— Skip —</option>
                    {LATEST_MAGAZINE_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {section === "topbar" && (
      <section className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 space-y-4">
        <h2 className="font-serif text-lg text-foreground">Top bar</h2>
        <div className="space-y-2">
          <Label>Partner sites (one per line: Label|URL)</Label>
          <p className="text-xs text-muted-foreground">
            Add as many links as you need. Each line: <code className="text-[11px] bg-muted px-1 rounded">Name|https://…</code> — only the first{" "}
            <code className="text-[11px] bg-muted px-1 rounded">|</code> splits label and URL.
          </p>
          <Textarea
            value={topLinksDraft}
            onChange={(e) => setTopLinksDraft(e.target.value)}
            placeholder={`Michampsindia|https://michampsindia.com/\nHighereducationplus|https://highereducationplus.com/\nAsli Prep|https://www.asliprep.com/\nEttechX|https://www.ettechx.com/`}
            className="min-h-[140px] font-mono text-sm"
            spellCheck={false}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(["facebook", "twitter", "instagram", "linkedin", "youtube"] as const).map((k) => (
            <div className="space-y-2" key={k}>
              <Label>{k}</Label>
              <Input
                value={(data.topBar?.social as any)?.[k] || ""}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    topBar: { ...(p.topBar || {}), social: { ...(p.topBar?.social || {}), [k]: e.target.value } },
                  }))
                }
                className="h-11"
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Social email</Label>
            <Input
              value={data.topBar?.social?.email || ""}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  topBar: { ...(p.topBar || {}), social: { ...(p.topBar?.social || {}), email: e.target.value } },
                }))
              }
              placeholder="info@brainfeedmagazine.com"
              className="h-11"
            />
          </div>
        </div>
      </section>
      )}

      {section === "footer" && (
      <section className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 space-y-4">
        <h2 className="font-serif text-lg text-foreground">Footer</h2>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={data.footer?.description || ""}
            onChange={(e) => setData((p) => ({ ...p, footer: { ...(p.footer || {}), description: e.target.value } }))}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label>Footer email</Label>
          <Input
            value={data.footer?.email || ""}
            onChange={(e) => setData((p) => ({ ...p, footer: { ...(p.footer || {}), email: e.target.value } }))}
            className="h-11"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(["facebook", "twitter", "instagram", "linkedin", "youtube"] as const).map((k) => (
            <div className="space-y-2" key={k}>
              <Label>{k}</Label>
              <Input
                value={(data.footer?.social as any)?.[k] || ""}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    footer: { ...(p.footer || {}), social: { ...(p.footer?.social || {}), [k]: e.target.value } },
                  }))
                }
                className="h-11"
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Social email</Label>
            <Input
              value={data.footer?.social?.email || ""}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  footer: { ...(p.footer || {}), social: { ...(p.footer?.social || {}), email: e.target.value } },
                }))
              }
              className="h-11"
            />
          </div>
        </div>
      </section>
      )}

      {section === "about" && (
      <section className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 space-y-4">
        <h2 className="font-serif text-lg text-foreground">About page (text + images)</h2>

        <div className="space-y-3">
          <h3 className="font-serif text-base text-foreground">About images</h3>
          <div className="space-y-2">
            <Label>Hero image (right side)</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("heroImageUrl");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              <Input
                id="about-upload-input"
                type="file"
                accept="image/*"
                disabled={uploadingAboutImage}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !token) return;
                  setUploadingAboutImage(true);
                  try {
                    const form = new FormData();
                    form.append("image", file);
                    const res = await fetch(`${API_BASE}/api/admin/site-settings/about-image`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: form,
                    });
                    const j = await res.json();
                    if (!res.ok) throw new Error(j?.error || "Upload failed");
                    if (j.url) {
                      setData((p) => ({
                        ...p,
                        about: { ...(p.about || {}), [aboutUploadKey]: j.url } as any,
                      }));
                      toast.success("About image uploaded.");
                    }
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to upload image.");
                  } finally {
                    setUploadingAboutImage(false);
                    e.target.value = "";
                  }
                }}
              />

              {data.about?.heroImageUrl && (
                <p className="truncate text-xs text-muted-foreground">Current: {data.about.heroImageUrl}</p>
              )}

              <div className="space-y-2">
                <Label>Hero image alt text</Label>
                <Input
                  value={data.about?.heroImageAlt || ""}
                  onChange={(e) =>
                    setData((p) => ({ ...p, about: { ...(p.about || {}), heroImageAlt: e.target.value } }))
                  }
                  placeholder="Short description for accessibility"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Brainfeed Magazine cover</Label>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("aboutCoverMain");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              {data.about?.aboutCoverMain && (
                <p className="truncate text-xs text-muted-foreground">Current: {data.about.aboutCoverMain}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brainfeed High cover</Label>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("aboutCoverHigh");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              {data.about?.aboutCoverHigh && (
                <p className="truncate text-xs text-muted-foreground">Current: {data.about.aboutCoverHigh}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brainfeed Primary 2 cover</Label>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("aboutCoverPrimary2");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              {data.about?.aboutCoverPrimary2 && (
                <p className="truncate text-xs text-muted-foreground">
                  Current: {data.about.aboutCoverPrimary2}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brainfeed Primary 1 cover</Label>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("aboutCoverPrimary1");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              {data.about?.aboutCoverPrimary1 && (
                <p className="truncate text-xs text-muted-foreground">
                  Current: {data.about.aboutCoverPrimary1}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brainfeed Junior cover</Label>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploadingAboutImage}
                onClick={() => {
                  setAboutUploadKey("aboutCoverJunior");
                  document.getElementById("about-upload-input")?.click();
                }}
              >
                {uploadingAboutImage ? "Uploading…" : "Upload image"}
              </Button>
              {data.about?.aboutCoverJunior && (
                <p className="truncate text-xs text-muted-foreground">Current: {data.about.aboutCoverJunior}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Hero eyebrow</Label>
          <Input
            value={data.about?.heroEyebrow || ""}
            onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), heroEyebrow: e.target.value } }))}
            placeholder="Knowing Brainfeed"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Hero title</Label>
          <Input
            value={data.about?.heroTitle || ""}
            onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), heroTitle: e.target.value } }))}
            placeholder="Empowering children in their journey..."
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Hero description</Label>
          <Textarea
            value={data.about?.heroBody || ""}
            onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), heroBody: e.target.value } }))}
            className="min-h-[80px]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Stat 1 value</Label>
            <Input
              value={data.about?.stat1Value || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat1Value: e.target.value } }))}
              placeholder="60,000+"
              className="h-11"
            />
            <Input
              value={data.about?.stat1Label || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat1Label: e.target.value } }))}
              placeholder="Schools Reached"
              className="h-9 text-xs mt-1"
            />
          </div>
          <div className="space-y-1">
            <Label>Stat 2 value</Label>
            <Input
              value={data.about?.stat2Value || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat2Value: e.target.value } }))}
              placeholder="3 Lakh+"
              className="h-11"
            />
            <Input
              value={data.about?.stat2Label || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat2Label: e.target.value } }))}
              placeholder="School Leaders & Educators"
              className="h-9 text-xs mt-1"
            />
          </div>
          <div className="space-y-1">
            <Label>Stat 3 value</Label>
            <Input
              value={data.about?.stat3Value || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat3Value: e.target.value } }))}
              placeholder="1,75,000"
              className="h-11"
            />
            <Input
              value={data.about?.stat3Label || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat3Label: e.target.value } }))}
              placeholder="Subscribers"
              className="h-9 text-xs mt-1"
            />
          </div>
          <div className="space-y-1">
            <Label>Stat 4 value</Label>
            <Input
              value={data.about?.stat4Value || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat4Value: e.target.value } }))}
              placeholder="45+"
              className="h-11"
            />
            <Input
              value={data.about?.stat4Label || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat4Label: e.target.value } }))}
              placeholder="Educational Conferences"
              className="h-9 text-xs mt-1"
            />
          </div>
          <div className="space-y-1">
            <Label>Stat 5 value</Label>
            <Input
              value={data.about?.stat5Value || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat5Value: e.target.value } }))}
              placeholder="12,000+"
              className="h-11"
            />
            <Input
              value={data.about?.stat5Label || ""}
              onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), stat5Label: e.target.value } }))}
              placeholder="Leaders Recognised"
              className="h-9 text-xs mt-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Conferences & expos text</Label>
          <Textarea
            value={data.about?.conferencesBody || ""}
            onChange={(e) =>
              setData((p) => ({ ...p, about: { ...(p.about || {}), conferencesBody: e.target.value } }))
            }
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label>Awards text</Label>
          <Textarea
            value={data.about?.awardsBody || ""}
            onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), awardsBody: e.target.value } }))}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA title (bottom section)</Label>
          <Textarea
            value={data.about?.ctaTitle || ""}
            onChange={(e) => setData((p) => ({ ...p, about: { ...(p.about || {}), ctaTitle: e.target.value } }))}
            className="min-h-[60px]"
          />
        </div>
      </section>
      )}

      {section === "contact" && (
      <section className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 space-y-4">
        <h2 className="font-serif text-lg text-foreground">Contact page</h2>
        <div className="space-y-2">
          <Label>Address (one line per row)</Label>
          <Textarea
            value={addressText}
            onChange={(e) =>
              setData((p) => ({ ...p, contact: { ...(p.contact || {}), addressLines: e.target.value.split("\n") } }))
            }
            className="min-h-[110px]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>WhatsApp (digits only)</Label>
            <Input
              value={data.contact?.whatsapp || ""}
              onChange={(e) => setData((p) => ({ ...p, contact: { ...(p.contact || {}), whatsapp: e.target.value } }))}
              placeholder="918448737157"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone (alternate)</Label>
            <Input
              value={data.contact?.phoneAlt || ""}
              onChange={(e) => setData((p) => ({ ...p, contact: { ...(p.contact || {}), phoneAlt: e.target.value } }))}
              placeholder="+91 1234567890"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Emails (one per line)</Label>
            <Textarea
              value={emailsText}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), emails: e.target.value.split("\n") } }))
              }
              className="min-h-[110px]"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Region title</Label>
            <Input
              value={data.contact?.regionTitle || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), regionTitle: e.target.value } }))
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Region name</Label>
            <Input
              value={data.contact?.regionName || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), regionName: e.target.value } }))
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Region WhatsApp</Label>
            <Input
              value={data.contact?.regionWhatsapp || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), regionWhatsapp: e.target.value } }))
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Region email</Label>
            <Input
              value={data.contact?.regionEmail || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), regionEmail: e.target.value } }))
              }
              className="h-11"
            />
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Find Us — map</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a screenshot or graphic for a cleaner look, or use the live Google embed below. If an image is set,
              it replaces the embed. Use zoom 15–17 in Google Maps when saving embed URLs so streets and labels show
              clearly.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Static map image (optional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingContactMap}
                onClick={() => document.getElementById("contact-map-upload-input")?.click()}
              >
                {uploadingContactMap ? "Uploading…" : "Upload map image"}
              </Button>
              {data.contact?.mapImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    setData((p) => ({ ...p, contact: { ...(p.contact || {}), mapImageUrl: "" } }))
                  }
                >
                  Remove image
                </Button>
              )}
            </div>
            <Input
              id="contact-map-upload-input"
              type="file"
              accept="image/*"
              disabled={uploadingContactMap}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !token) return;
                setUploadingContactMap(true);
                try {
                  const form = new FormData();
                  form.append("image", file);
                  const res = await fetch(`${API_BASE}/api/admin/site-settings/contact-map-image`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: form,
                  });
                  const j = await res.json();
                  if (!res.ok) throw new Error(j?.error || "Upload failed");
                  if (j.url) {
                    setData((p) => ({
                      ...p,
                      contact: { ...(p.contact || {}), mapImageUrl: j.url },
                    }));
                    toast.success("Map image uploaded. Save settings to publish.");
                  }
                } catch (err: any) {
                  toast.error(err?.message || "Failed to upload map image.");
                } finally {
                  setUploadingContactMap(false);
                  e.target.value = "";
                }
              }}
            />
            {data.contact?.mapImageUrl && (
              <div className="rounded-md border border-border/60 overflow-hidden max-w-md">
                <img
                  src={data.contact.mapImageUrl}
                  alt=""
                  className="w-full h-auto max-h-48 object-cover object-center"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Map image description (accessibility)</Label>
            <Input
              value={data.contact?.mapImageAlt || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), mapImageAlt: e.target.value } }))
              }
              placeholder="Brainfeed office location on a map"
              className="h-11"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Map URL (link)</Label>
            <Input
              value={data.contact?.mapUrl || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), mapUrl: e.target.value } }))
              }
              placeholder="https://www.google.com/maps?..."
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Map embed URL (iframe src)</Label>
            <Input
              value={data.contact?.mapEmbedUrl || ""}
              onChange={(e) =>
                setData((p) => ({ ...p, contact: { ...(p.contact || {}), mapEmbedUrl: e.target.value } }))
              }
              placeholder="https://www.google.com/maps?q=...&z=16&output=embed"
              className="h-11"
            />
          </div>
        </div>
      </section>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSiteSettings;

