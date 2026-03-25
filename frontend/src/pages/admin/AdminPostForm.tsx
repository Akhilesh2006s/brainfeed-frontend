import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, Video, Music, Link2, Quote, X } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { buildApiUrl } from "@/lib/apiUrl";

const NEWS_CATEGORIES = [
  "Achievement",
  "Press Release",
  "Career",
  "Education",
  "Institutional Profile",
  "Internship",
  "Jobs",
  "Science & Environment",
  "Technology",
  "Expert View",
];
const FORMATS = [
  { value: "standard", label: "Standard" },
  { value: "gallery", label: "Gallery" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "link", label: "Link" },
  { value: "quote", label: "Quote" },
];

const VALID_FORMATS = new Set(FORMATS.map((f) => f.value));

const AdminPostForm = () => {
  const { id } = useParams();
  const type = "news";
  const isEdit = Boolean(id);
  const { token, isLoading: adminAuthLoading } = useAdmin();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState("standard");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [readTime, setReadTime] = useState("4 min read");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyphrase, setFocusKeyphrase] = useState("");
  /** SEO tags (meta keywords / topic labels), WordPress-style */
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Saved URLs when editing — for live preview before re-upload */
  const [existingFeaturedImageUrl, setExistingFeaturedImageUrl] = useState("");
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [featuredImageObjectUrl, setFeaturedImageObjectUrl] = useState<string | null>(null);
  /** Edit: user asked to remove all saved gallery images on next save */
  const [clearGalleryOnSave, setClearGalleryOnSave] = useState(false);

  const categories = NEWS_CATEGORIES;

  /** Radix Select requires `value` to match a `SelectItem`; include unknown DB categories. */
  const categoryOptions = useMemo(() => {
    const c = category.trim();
    if (c && !NEWS_CATEGORIES.includes(c)) {
      return [c, ...NEWS_CATEGORIES];
    }
    return NEWS_CATEGORIES;
  }, [category]);

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
            ? "Image upload API returned 404 — start the backend (port 3001), set VITE_API_URL in .env, or redeploy the server with the latest code."
            : (data as { error?: string })?.error || "Image upload failed";
        throw new Error(hint);
      }
      const url = (data as { url?: string }).url;
      if (!url) throw new Error("No image URL returned");
      return url;
    },
    [token],
  );

  function slugifyTitle(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  const parseTagInput = (raw: string) =>
    raw
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);

  const addTagsFromInput = () => {
    const next = parseTagInput(tagInput);
    if (next.length === 0) return;
    setTags((prev) => {
      const seen = new Set(prev.map((t) => t.toLowerCase()));
      const merged = [...prev];
      for (const t of next) {
        const k = t.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(t);
        }
      }
      return merged.slice(0, 80);
    });
    setTagInput("");
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  /** Only pick a default category for *new* posts — editing must wait for GET so we don't race the loader. */
  useEffect(() => {
    if (isEdit) return;
    if (!category && categories.length) setCategory(categories[0]);
  }, [isEdit, type, categories, category]);

  useEffect(() => {
    if (!featuredImage) {
      setFeaturedImageObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(featuredImage);
    setFeaturedImageObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [featuredImage]);

  const galleryLocalPreviews = useMemo(() => galleryFiles.map((f) => URL.createObjectURL(f)), [galleryFiles]);
  useEffect(() => {
    return () => galleryLocalPreviews.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryLocalPreviews]);

  const videoFilePreviewUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : null), [videoFile]);
  useEffect(() => {
    return () => {
      if (videoFilePreviewUrl) URL.revokeObjectURL(videoFilePreviewUrl);
    };
  }, [videoFilePreviewUrl]);

  const audioFilePreviewUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : null), [audioFile]);
  useEffect(() => {
    return () => {
      if (audioFilePreviewUrl) URL.revokeObjectURL(audioFilePreviewUrl);
    };
  }, [audioFilePreviewUrl]);

  const featuredPreviewSrc = featuredImageObjectUrl || existingFeaturedImageUrl || "";
  const galleryPreviewItems = useMemo(() => {
    const items: { key: string; src: string }[] = [];
    existingGalleryUrls.forEach((u, i) => items.push({ key: `saved-${i}`, src: u }));
    galleryLocalPreviews.forEach((u, i) => items.push({ key: `new-${i}`, src: u }));
    return items;
  }, [existingGalleryUrls, galleryLocalPreviews]);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!token) {
      if (!adminAuthLoading) {
        setLoading(false);
        setLoadError("You must be signed in to edit this post.");
      }
      return;
    }

    let cancelled = false;
    setLoadError(null);
    setLoading(true);
    /* New edit session — don’t carry over file picks from another post */
    setFeaturedImage(null);
    setGalleryFiles([]);
    setVideoFile(null);
    setAudioFile(null);
    setClearGalleryOnSave(false);

    fetch(buildApiUrl(`/admin/posts/${id}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((j as any)?.error || "Failed to load post");
        return j as Record<string, unknown>;
      })
      .then((raw) => {
        if (cancelled) return;
        // Handle multiple possible API response shapes defensively.
        const p = ((raw as any)?.post || (raw as any)?.data || raw || {}) as Record<string, unknown>;
        const rawMedia = (p as any).media;
        const media = (rawMedia && typeof rawMedia === "object" ? rawMedia : {}) as {
          gallery?: unknown;
          videoUrl?: string;
          audioUrl?: string;
          linkUrl?: string;
          quoteText?: string;
        };

        const fmtRaw = String((p as any).format || "standard");
        const fmt = VALID_FORMATS.has(fmtRaw) ? fmtRaw : "standard";

        setTitle(String((p as any).title ?? ""));
        setSubtitle(String((p as any).subtitle ?? ""));
        setSlug(String((p as any).slug ?? ""));
        setContent(String((p as any).content ?? ""));
        setFormat(fmt);
        setCategory(String((p as any).category ?? "").trim() || categories[0]);
        setExcerpt(String((p as any).excerpt ?? ""));
        setReadTime(String((p as any).readTime ?? "4 min read"));
        setMetaTitle(String((p as any).metaTitle ?? ""));
        setMetaDescription(String((p as any).metaDescription ?? ""));
        setFocusKeyphrase(String((p as any).focusKeyphrase ?? ""));
        const rawTags = (p as any).tags;
        setTags(
          Array.isArray(rawTags)
            ? rawTags.filter((x: unknown) => typeof x === "string").map((t: string) => t.trim()).filter(Boolean)
            : [],
        );
        setVideoUrl(String(media.videoUrl ?? ""));
        setAudioUrl(String(media.audioUrl ?? ""));
        setLinkUrl(String(media.linkUrl ?? ""));
        setQuoteText(String(media.quoteText ?? ""));
        setFeaturedImageAlt(String((p as any).featuredImageAlt ?? ""));
        setExistingFeaturedImageUrl(String((p as any).featuredImageUrl ?? "").trim());
        const g = media.gallery;
        setExistingGalleryUrls(
          Array.isArray(g) ? g.filter((x: unknown) => typeof x === "string").map((u) => String(u).trim()) : [],
        );
      })
      .catch((e) => {
        const msg = e?.message || "Failed to load post";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, id, token, adminAuthLoading, type, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim() || !category.trim()) {
      toast.error("Title and category are required.");
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("title", title.trim());
    formData.set("slug", (slug || slugifyTitle(title)).trim());
    formData.set("subtitle", subtitle.trim());
    formData.set("content", content);
    formData.set("format", format);
    formData.set("category", category.trim());
    formData.set("excerpt", excerpt.trim());
    formData.set("readTime", readTime.trim());
    formData.set("metaTitle", metaTitle.trim());
    formData.set("metaDescription", metaDescription.trim());
    formData.set("focusKeyphrase", focusKeyphrase.trim());
    formData.set("tags", JSON.stringify(tags));
    formData.set("featuredImageAlt", featuredImageAlt.trim());
    formData.set("videoUrl", videoUrl.trim());
    formData.set("audioUrl", audioUrl.trim());
    formData.set("linkUrl", linkUrl.trim());
    formData.set("quoteText", quoteText.trim());
    if (featuredImage) formData.set("featuredImage", featuredImage);
    galleryFiles.forEach((f) => formData.append("gallery", f));
    if (videoFile) formData.set("videoFile", videoFile);
    if (audioFile) formData.set("audioFile", audioFile);
    if (isEdit && clearGalleryOnSave) {
      formData.set("clearGallery", "true");
    }

    try {
      const url = isEdit ? buildApiUrl(`/admin/posts/${id}`) : buildApiUrl("/admin/posts");
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(isEdit ? "Post updated." : "Post created.");
      navigate(`/admin/posts?type=${type}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("slug")) {
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to save post.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  if (isEdit && loadError) {
    return (
      <div className="space-y-4 max-w-lg">
        <h1 className="font-serif text-2xl text-foreground">Edit news article</h1>
        <p className="text-sm text-destructive">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => navigate(`/admin/posts?type=${type}`)}>
          Back to posts
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground mb-2">
        {isEdit ? "Edit news article" : "Add news article"}
      </h1>
      {isEdit && (
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
          All saved fields appear below — title, slug, category, SEO, tags, format tabs, and body content (including inline
          images in the editor). Featured and gallery images are previewed next to each upload; open the matching{" "}
          <strong>Post format</strong> tab to see video, audio, link, or quote fields.
        </p>
      )}
      <div
        className={`grid gap-8 items-start ${
          showPreview
            ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
            : "grid-cols-1"
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-none">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => {
              const v = e.target.value;
              setTitle(v);
              if (!isEdit) setSlug(slugifyTitle(v));
            }}
            placeholder="Add title"
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug (URL name)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated-from-title"
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">
            Used in the article URL. Must be unique for each news post.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Add sub title here" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Content (paragraph / article body)</Label>
          <RichTextEditor
            key={isEdit && id ? `post-${id}` : "new-post"}
            variant="full"
            value={content}
            onChange={setContent}
            uploadInlineImage={uploadInlineImage}
            placeholder="Write your article here. Use the toolbar for bold, italic, images, links, and more."
          />
          <p className="text-xs text-muted-foreground">
            Use the toolbar for formatting. Use the image button to upload or embed images between paragraphs (like WordPress). You can also paste screenshots.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Excerpt (short summary)</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief excerpt for cards" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Read time</Label>
          <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="4 min read" className="h-11" />
        </div>

        <div className="space-y-2">
          <Label>Meta title (SEO)</Label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Optional custom title for search engines"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Meta description</Label>
          <Textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="1–2 sentence summary for search engines and social previews"
            className="min-h-[70px]"
          />
        </div>
        <div className="space-y-2">
          <Label>Focus keyphrase</Label>
          <Input
            value={focusKeyphrase}
            onChange={(e) => setFocusKeyphrase(e.target.value)}
            placeholder="Main keyword or keyphrase for this article"
            className="h-11"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
          <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tags (SEO)
          </Label>
          <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
            Add keywords or topics for search engines (<code className="text-[10px]">meta keywords</code>) and internal discovery.
            Separate tags with commas, or type one tag and press Add.
          </p>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagsFromInput();
                }
              }}
              placeholder="e.g. education policy, Telangana, curriculum"
              className="h-11 min-w-0 flex-1"
            />
            <Button type="button" variant="secondary" className="h-11 shrink-0" onClick={addTagsFromInput}>
              Add
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Separate tags with commas.</p>
          {tags.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {tags.map((tag, i) => (
                <div
                  key={`${tag}-${i}`}
                  className="inline-flex items-center gap-2 self-start max-w-full rounded-md bg-primary text-primary-foreground pl-1 pr-2.5 py-1.5 text-sm shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <span className="truncate font-medium">{tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Featured image</Label>
          {(featuredImageObjectUrl || (isEdit && existingFeaturedImageUrl && !featuredImage)) && (
            <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden max-w-md">
              <img
                src={featuredImageObjectUrl || existingFeaturedImageUrl}
                alt={featuredImageAlt || "Featured preview"}
                className="w-full max-h-56 object-contain bg-background"
              />
              <p className="text-[11px] text-muted-foreground px-3 py-2 border-t border-border/40">
                {featuredImageObjectUrl ? (
                  <span className="font-medium text-foreground">New image selected.</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Saved image.</span> Choose a new file below to replace it.
                  </>
                )}
              </p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">
            Upload the main image for the article. Use the field below for the image alt text (for accessibility and SEO).
          </p>
        </div>
        <div className="space-y-2">
          <Label>Featured image alt text</Label>
          <Input
            value={featuredImageAlt}
            onChange={(e) => setFeaturedImageAlt(e.target.value)}
            placeholder="Short description of the image"
            className="h-11"
          />
          <p className="text-[11px] text-muted-foreground">
            This text will be used as the <code>alt</code> attribute on the image.
          </p>
        </div>

        <Tabs value={format} onValueChange={(v) => setFormat(v)}>
          <Label className="block mb-2">Post format</Label>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
            {FORMATS.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">
                {f.value === "gallery" && <ImagePlus className="h-3.5 w-3.5 mr-1" />}
                {f.value === "video" && <Video className="h-3.5 w-3.5 mr-1" />}
                {f.value === "audio" && <Music className="h-3.5 w-3.5 mr-1" />}
                {f.value === "link" && <Link2 className="h-3.5 w-3.5 mr-1" />}
                {f.value === "quote" && <Quote className="h-3.5 w-3.5 mr-1" />}
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="gallery" className="mt-3 space-y-3">
            {isEdit && existingGalleryUrls.length > 0 && !clearGalleryOnSave && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-foreground">Saved gallery ({existingGalleryUrls.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingGalleryUrls.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="relative rounded-lg border border-border/60 overflow-hidden aspect-video bg-muted/30"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => {
                    setClearGalleryOnSave(true);
                    setExistingGalleryUrls([]);
                  }}
                >
                  Remove all saved gallery images
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Add more images below; they will be appended unless you remove all first.
                </p>
              </div>
            )}
            <div>
              <Label>Gallery images {isEdit ? "(add more)" : ""}</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                className="h-11 mt-1"
              />
            </div>
          </TabsContent>
          <TabsContent value="video" className="mt-3 space-y-2">
            <Label>Video URL (or upload file)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="h-11" />
            {videoUrl.trim() && !videoFile && (
              <div className="rounded-lg border border-border/60 overflow-hidden bg-black/80 max-w-xl">
                <video src={videoUrl.trim()} controls className="w-full max-h-56" />
                <p className="text-[10px] text-muted-foreground px-2 py-1.5 bg-card">Saved video URL</p>
              </div>
            )}
            <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="h-11" />
            {videoFile && (
              <p className="text-[11px] text-muted-foreground">New file selected — will replace / supplement on save per server rules.</p>
            )}
          </TabsContent>
          <TabsContent value="audio" className="mt-3 space-y-2">
            <Label>Audio URL (or upload file)</Label>
            <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." className="h-11" />
            {audioUrl.trim() && !audioFile && (
              <div className="rounded-lg border border-border/60 overflow-hidden max-w-xl">
                <audio src={audioUrl.trim()} controls className="w-full" />
                <p className="text-[10px] text-muted-foreground px-2 py-1.5 bg-muted/30">Saved audio URL</p>
              </div>
            )}
            <Input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="h-11" />
          </TabsContent>
          <TabsContent value="link" className="mt-3">
            <Label>Link URL</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-11" />
          </TabsContent>
          <TabsContent value="quote" className="mt-3">
            <Label>Quote text</Label>
            <Textarea value={quoteText} onChange={(e) => setQuoteText(e.target.value)} placeholder="Quote content" className="min-h-[80px]" />
          </TabsContent>
        </Tabs>

          <div className="flex flex-wrap gap-3 items-center">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Update post" : "Create post"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/posts?type=${type}`)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto text-xs"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Hide preview" : "Show live preview"}
            </Button>
          </div>
        </form>

        {showPreview && (
          <aside className="border border-border/60 rounded-2xl bg-card/60 p-5 space-y-4 max-h-[80vh] overflow-auto">
            <h2 className="font-serif text-xl mb-2 text-foreground">Live preview</h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Post format: <span className="font-semibold text-foreground">{format}</span>
            </p>
            {category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold uppercase tracking-[0.16em]">
                {category}
              </span>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center rounded-md bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <h3 className="font-serif text-2xl md:text-3xl text-foreground leading-tight">
              {title || "Article title"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {readTime || "4 min read"}
            </p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

            {featuredPreviewSrc && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Featured image</p>
                <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/30">
                  <img
                    src={featuredPreviewSrc}
                    alt={featuredImageAlt || title || "Featured"}
                    className="w-full max-h-56 object-contain"
                  />
                </div>
                {featuredImageAlt && <p className="text-[11px] text-muted-foreground mt-1">Alt: {featuredImageAlt}</p>}
              </div>
            )}

            {galleryPreviewItems.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Gallery</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {galleryPreviewItems.map((item) => (
                    <div key={item.key} className="rounded-lg overflow-hidden border border-border/50 bg-muted/20 aspect-video">
                      <img src={item.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {format === "video" && (videoUrl.trim() || videoFilePreviewUrl) && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Video</p>
                <video
                  src={videoUrl.trim() || videoFilePreviewUrl || undefined}
                  controls
                  className="w-full rounded-xl border border-border/60 max-h-64 bg-black"
                />
                {videoUrl.trim() && <p className="text-[11px] text-muted-foreground mt-1 break-all">URL: {videoUrl.trim()}</p>}
              </div>
            )}

            {format === "audio" && (audioUrl.trim() || audioFilePreviewUrl) && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Audio</p>
                <audio src={audioUrl.trim() || audioFilePreviewUrl || undefined} controls className="w-full" />
                {audioUrl.trim() && <p className="text-[11px] text-muted-foreground mt-1 break-all">URL: {audioUrl.trim()}</p>}
              </div>
            )}

            {format === "link" && linkUrl.trim() && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Link</p>
                <a href={linkUrl.trim()} target="_blank" rel="noreferrer" className="text-accent text-sm font-medium break-all underline">
                  {linkUrl.trim()}
                </a>
              </div>
            )}

            {format === "quote" && quoteText.trim() && (
              <blockquote className="border-l-4 border-accent pl-4 py-1 text-foreground italic font-serif text-lg leading-relaxed">
                {quoteText.trim()}
              </blockquote>
            )}

            {content ? (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Article body</p>
                <div className="news-article-body prose prose-sm sm:prose-base max-w-none text-foreground font-sans leading-relaxed">
                  <div
                    className="[&_p]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p:empty]:block [&_p:empty]:h-6 [&_h1]:mt-7 [&_h1]:mb-3 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:mt-4 [&_h4]:mb-2 [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1 [&_blockquote]:my-4 [&_.editor-inline-figure]:my-6 [&_.editor-inline-img]:rounded-xl [&_.editor-inline-img]:h-auto [&_.editor-inline-img]:max-w-full [&_.editor-inline-img]:w-full"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                Add article body on the left. Inline images appear here after you insert them in the editor.
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default AdminPostForm;
