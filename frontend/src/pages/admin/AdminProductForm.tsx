import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type Category = "pre-primary" | "library" | "classroom" | "magazine";

const CATEGORY_LABELS: { value: Category; label: string }[] = [
  { value: "pre-primary", label: "Pre Primary Packs" },
  { value: "library", label: "Library Packs" },
  { value: "classroom", label: "Classroom Packs" },
  { value: "magazine", label: "Magazines" },
];

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAdmin();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category>("pre-primary");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [tag, setTag] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  /** Up to 4 extra gallery images (URLs + optional file per slot) */
  const [galleryUrls, setGalleryUrls] = useState<string[]>(["", "", "", ""]);
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const galleryBlobUrls = useMemo(
    () => galleryFiles.map((f) => (f ? URL.createObjectURL(f) : null)),
    [galleryFiles],
  );
  useEffect(() => {
    return () => {
      galleryBlobUrls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [galleryBlobUrls]);

  useEffect(() => {
    if (!isEdit || !id || !token) return;
    fetch(`${API_BASE}/api/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((p) => {
        if (!p) return;
        setCategory(p.category);
        setName(p.name || "");
        setSlug(p.slug || "");
        setDescription(p.description || "");
        setBadge(p.badge || "");
        setTag(p.tag || "");
        setPrice(p.price != null ? String(p.price) : "");
        setOldPrice(p.oldPrice != null ? String(p.oldPrice) : "");
        setCurrency(p.currency || "INR");
        setOrder(p.order ?? 0);
        setActive(p.active !== false);
        setImageUrl(p.imageUrl || "");
        const g = Array.isArray(p.galleryImageUrls) ? p.galleryImageUrls.map((u: string) => String(u || "").trim()) : [];
        setGalleryUrls([0, 1, 2, 3].map((i) => g[i] || ""));
        setGalleryFiles([null, null, null, null]);
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [isEdit, id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!price.trim()) {
      toast.error("Price is required.");
      return;
    }
    const formData = new FormData();
    formData.set("category", category);
    formData.set("name", name.trim());
    if (slug.trim()) formData.set("slug", slug.trim());
    formData.set("description", description.trim());
    formData.set("badge", badge.trim());
    formData.set("tag", tag.trim());
    formData.set("price", price.trim());
    if (oldPrice.trim()) formData.set("oldPrice", oldPrice.trim());
    formData.set("currency", currency.trim());
    formData.set("order", String(order || 0));
    formData.set("active", active ? "true" : "false");
    if (imageUrl.trim() && !imageFile) {
      formData.set("imageUrl", imageUrl.trim());
    }
    if (imageFile) {
      formData.set("image", imageFile);
    }
    formData.set("galleryImageUrls", JSON.stringify(galleryUrls.map((u) => u.trim())));
    for (let i = 0; i < 4; i++) {
      if (galleryFiles[i]) formData.append(`gallery${i}`, galleryFiles[i]);
    }

    setSaving(true);
    try {
      const url = isEdit
        ? `${API_BASE}/api/admin/products/${id}`
        : `${API_BASE}/api/admin/products`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save product.");
        return;
      }
      toast.success(isEdit ? "Product updated." : "Product created.");
      navigate("/admin/products");
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-1">
          {isEdit ? "Edit subscription product" : "Add subscription product"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Products created here power the packs and magazine tiles on the public Subscribe page.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/60 bg-card/70 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_LABELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Display order</Label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Name (title)</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tiny Pack, Brainfeed Magazine"
            className="h-10"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Slug (optional)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="used for internal URLs"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Short description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two lines about this pack or magazine."
            className="min-h-[70px]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Current price (₹)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Old price (₹, optional)</Label>
            <Input
              type="number"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>Badge (optional)</Label>
            <Input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="-20%, Best value, etc."
              className="h-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tag (optional)</Label>
          <Input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Shown as small label, e.g. 'Pre Primary Packs'"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Main product image</Label>
          {imageUrl && (
            <div className="mb-2">
              <img
                src={imageUrl}
                alt={name}
                className="w-full max-w-xs rounded-md border border-border/60"
              />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="h-10"
          />
          <p className="text-[11px] text-muted-foreground">
            Upload a new image file to replace the current one, or leave empty to keep the existing
            image. You can also paste an image URL directly:
          </p>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 mt-1"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label>Extra gallery images (optional, max 4)</Label>
            <p className="text-[11px] text-muted-foreground mt-1">
              Shown below the main image on the product page (Amazon-style thumbnails). Upload files or
              paste URLs — up to four.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((slot) => {
              const preview = galleryBlobUrls[slot] || galleryUrls[slot] || "";
              return (
                <div key={slot} className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Image {slot + 1}</p>
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="w-full aspect-square object-cover rounded-2xl border border-border/50"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-2xl border border-dashed border-border/60 flex items-center justify-center text-[10px] text-muted-foreground">
                      Empty
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-9 text-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setGalleryFiles((prev) => {
                        const next = [...prev];
                        next[slot] = f;
                        return next;
                      });
                      e.target.value = "";
                    }}
                  />
                  <Input
                    value={galleryUrls[slot]}
                    onChange={(e) =>
                      setGalleryUrls((prev) => {
                        const next = [...prev];
                        next[slot] = e.target.value;
                        return next;
                      })
                    }
                    placeholder="Image URL (optional)"
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full text-xs text-destructive"
                    onClick={() => {
                      setGalleryUrls((prev) => {
                        const next = [...prev];
                        next[slot] = "";
                        return next;
                      });
                      setGalleryFiles((prev) => {
                        const next = [...prev];
                        next[slot] = null;
                        return next;
                      });
                    }}
                  >
                    Clear slot
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="product-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="product-active" className="text-sm text-muted-foreground">
            Show this product on the Subscribe page
          </Label>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update product" : "Create product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;

