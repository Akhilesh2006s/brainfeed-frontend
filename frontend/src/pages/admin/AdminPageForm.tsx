import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "page";
}

type PageOption = { _id: string; title: string; slug: string };

const AdminPageForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token, isLoading: adminAuthLoading } = useAdmin();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [parent, setParent] = useState<string>("");
  const [order, setOrder] = useState(0);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageAlt, setHeroImageAlt] = useState("");
  const [aboutCoverMain, setAboutCoverMain] = useState("");
  const [aboutCoverHigh, setAboutCoverHigh] = useState("");
  const [aboutCoverPrimary2, setAboutCoverPrimary2] = useState("");
  const [aboutCoverPrimary1, setAboutCoverPrimary1] = useState("");
  const [aboutCoverJunior, setAboutCoverJunior] = useState("");
  const [parentOptions, setParentOptions] = useState<PageOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Same endpoint as news post editor — uploads to Cloudinary (needs backend route + redeploy on Railway). */
  const uploadInlineImage = useCallback(
    async (file: File) => {
      if (!token) throw new Error("Sign in required");
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(buildApiUrl("/admin/posts/inline-image"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const hint =
          res.status === 404
            ? "Image upload API missing on server — redeploy backend with latest code (POST /api/admin/posts/inline-image)."
            : (data as { error?: string })?.error || "Image upload failed";
        throw new Error(hint);
      }
      const url = (data as { url?: string }).url;
      if (!url) throw new Error("No image URL returned");
      return url;
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    fetch(buildApiUrl("/admin/pages"), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((pages: PageOption[]) => setParentOptions(Array.isArray(pages) ? pages.filter((p) => p._id !== id) : []))
      .catch(() => setParentOptions([]));
  }, [token, id]);

  /** New pages only — never overwrite slug from title while editing an existing page */
  useEffect(() => {
    if (isEdit) return;
    if (!title) setSlug("");
    else setSlug(slugFromTitle(title));
  }, [title, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!token) {
      if (!adminAuthLoading) {
        setLoading(false);
        setLoadError("You must be signed in to edit this page.");
      }
      return;
    }

    let cancelled = false;
    setLoadError(null);
    setLoading(true);

    fetch(buildApiUrl(`/admin/pages/${id}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((j as { error?: string })?.error || "Failed to load page");
        return j as Record<string, unknown>;
      })
      .then((raw) => {
        if (cancelled) return;
        const p = ((raw as any)?.page || (raw as any)?.data || raw || {}) as {
          title?: string;
          slug?: string;
          content?: string;
          parent?: string | { toString?: () => string } | null;
          order?: number;
          heroImageUrl?: string;
          heroImageAlt?: string;
          aboutCovers?: {
            main?: string;
            high?: string;
            primary2?: string;
            primary1?: string;
            junior?: string;
          };
        };

        setTitle(String(p.title ?? ""));
        setSlug(String(p.slug ?? ""));
        setContent(String(p.content ?? ""));
        const parentVal = p.parent;
        setParent(
          parentVal != null && parentVal !== ""
            ? typeof parentVal === "object" && parentVal && "_id" in parentVal
              ? String((parentVal as { _id: unknown })._id)
              : String(parentVal)
            : "",
        );
        const ord = p.order;
        const num =
          typeof ord === "number" && !Number.isNaN(ord)
            ? ord
            : Number(ord);
        setOrder(Number.isFinite(num) ? num : 0);
        setHeroImageUrl(String(p.heroImageUrl ?? ""));
        setHeroImageAlt(String(p.heroImageAlt ?? ""));
        setAboutCoverMain(String(p.aboutCovers?.main ?? ""));
        setAboutCoverHigh(String(p.aboutCovers?.high ?? ""));
        setAboutCoverPrimary2(String(p.aboutCovers?.primary2 ?? ""));
        setAboutCoverPrimary1(String(p.aboutCovers?.primary1 ?? ""));
        setAboutCoverJunior(String(p.aboutCovers?.junior ?? ""));
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to load page";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, id, token, adminAuthLoading]);

  /** Radix Select requires value to match an item — include saved parent if list omits it */
  const parentSelectOptions = useMemo(() => {
    if (!parent) return parentOptions;
    if (parentOptions.some((o) => o._id === parent)) return parentOptions;
    return [
      ...parentOptions,
      { _id: parent, title: "(Parent page)", slug: "" },
    ];
  }, [parentOptions, parent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    const body = JSON.stringify({
      title: title.trim(),
      slug: slug.trim() || slugFromTitle(title),
      content,
      parent: parent || null,
      order,
      heroImageUrl: heroImageUrl.trim(),
      heroImageAlt: heroImageAlt.trim(),
      aboutCoverMain: aboutCoverMain.trim(),
      aboutCoverHigh: aboutCoverHigh.trim(),
      aboutCoverPrimary2: aboutCoverPrimary2.trim(),
      aboutCoverPrimary1: aboutCoverPrimary1.trim(),
      aboutCoverJunior: aboutCoverJunior.trim(),
    });
    try {
      const url = isEdit ? buildApiUrl(`/admin/pages/${id}`) : buildApiUrl("/admin/pages");
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(isEdit ? "Page updated." : "Page created.");
      navigate("/admin/pages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save page.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  if (isEdit && loadError) {
    return (
      <div className="space-y-4 max-w-lg">
        <h1 className="font-serif text-2xl text-foreground">Edit page</h1>
        <p className="text-sm text-destructive">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/pages")}>
          Back to pages
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground mb-6">
        {isEdit ? "Edit page" : "Add page"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-none">
        <div className="space-y-2">
          <Label>Page title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. About Us, Contact, Services"
            required
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">This also becomes the URL slug if you don’t set one below.</p>
        </div>
        {(slug === "about" || slug === "about-us") && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4 md:p-5">
            <h2 className="font-serif text-lg text-foreground">About page images</h2>
            <p className="text-xs text-muted-foreground">
              These image URLs are used on the public About Us page. Leave any field blank to use the default design image.
            </p>
            <div className="space-y-2">
              <Label>Hero image URL (right side)</Label>
              <Input
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://..."
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Hero image alt text</Label>
              <Input
                value={heroImageAlt}
                onChange={(e) => setHeroImageAlt(e.target.value)}
                placeholder="Short description for accessibility"
                className="h-11"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Brainfeed Magazine cover URL</Label>
                <Input
                  value={aboutCoverMain}
                  onChange={(e) => setAboutCoverMain(e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Brainfeed High cover URL</Label>
                <Input
                  value={aboutCoverHigh}
                  onChange={(e) => setAboutCoverHigh(e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Brainfeed Primary 2 cover URL</Label>
                <Input
                  value={aboutCoverPrimary2}
                  onChange={(e) => setAboutCoverPrimary2(e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Brainfeed Primary 1 cover URL</Label>
                <Input
                  value={aboutCoverPrimary1}
                  onChange={(e) => setAboutCoverPrimary1(e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Brainfeed Junior cover URL</Label>
                <Input
                  value={aboutCoverJunior}
                  onChange={(e) => setAboutCoverJunior(e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>URL slug (optional)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. about-us, contact"
            className="h-11 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Page URL: /{slug || slugFromTitle(title) || "…"}</p>
        </div>
        <div className="space-y-2">
          <Label>Parent page (optional)</Label>
          <Select value={parent || "none"} onValueChange={(v) => setParent(v === "none" ? "" : v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="None (top level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top level)</SelectItem>
              {parentSelectOptions.map((p) => (
                <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">For hierarchy, e.g. Services → Web Development.</p>
        </div>
        <div className="space-y-2">
          <Label>Order (optional)</Label>
          <Input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value) || 0)}
            className="h-11 w-24"
          />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            key={isEdit && id ? `page-${id}` : "new-page"}
            variant="basic"
            value={content}
            onChange={setContent}
            placeholder="Add content using the toolbar: headings, lists, links, etc. Paste a YouTube link on its own line to embed the video."
            uploadInlineImage={uploadInlineImage}
          />
          <p className="text-xs text-muted-foreground">
            To embed a YouTube video, paste the video URL (for example
            {" "}
            <code>https://www.youtube.com/watch?v=...</code>
            {" "}
            or
            {" "}
            <code>https://youtu.be/...</code>
            {" "}
            on its own line. It will be shown as an embedded video on the page.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update page" : "Publish page"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/pages")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminPageForm;
