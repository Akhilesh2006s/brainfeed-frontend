import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Images, Trash2, ChevronUp, ChevronDown, ImageIcon, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type GalleryRow = {
  _id: string;
  kind: "image" | "youtube";
  imageUrl?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  title: string;
  caption: string;
  order: number;
  active: boolean;
};

const AdminGallery = () => {
  const { token } = useAdmin();
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addKind, setAddKind] = useState<"image" | "youtube">("image");
  const [addTitle, setAddTitle] = useState("");
  const [addCaption, setAddCaption] = useState("");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addYoutubeUrl, setAddYoutubeUrl] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(buildApiUrl("/admin/gallery"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async () => {
    if (!token) return;
    if (addKind === "image" && !addImageFile && !addImageUrl.trim()) {
      toast.error("Choose an image file or paste an image URL.");
      return;
    }
    if (addKind === "youtube" && !addYoutubeUrl.trim()) {
      toast.error("Paste a YouTube link.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("kind", addKind);
      fd.set("title", addTitle.trim());
      fd.set("caption", addCaption.trim());
      fd.set("active", "true");
      if (addKind === "image") {
        if (addImageFile) fd.set("image", addImageFile);
        else fd.set("imageUrl", addImageUrl.trim());
      } else {
        fd.set("youtubeUrl", addYoutubeUrl.trim());
      }
      const res = await fetch(buildApiUrl("/admin/gallery"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Failed to add");
      toast.success("Gallery item added.");
      setAddTitle("");
      setAddCaption("");
      setAddImageFile(null);
      setAddImageUrl("");
      setAddYoutubeUrl("");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const patchItem = async (id: string, patch: Partial<GalleryRow> & { imageFile?: File | null }) => {
    if (!token) return;
    const fd = new FormData();
    if (patch.title !== undefined) fd.set("title", patch.title);
    if (patch.caption !== undefined) fd.set("caption", patch.caption);
    if (patch.active !== undefined) fd.set("active", patch.active ? "true" : "false");
    if (patch.youtubeUrl !== undefined) fd.set("youtubeUrl", patch.youtubeUrl);
    if (patch.imageUrl !== undefined) fd.set("imageUrl", patch.imageUrl);
    if (patch.imageFile) fd.set("image", patch.imageFile);
    const res = await fetch(buildApiUrl(`/admin/gallery/${id}`), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || "Failed to save");
  };

  const saveRow = async (id: string) => {
    const row = items.find((x) => x._id === id);
    if (!row || !token) return;
    setSaving(true);
    try {
      await patchItem(id, {
        title: row.title,
        caption: row.caption,
        active: row.active,
        youtubeUrl: row.kind === "youtube" ? row.youtubeUrl : undefined,
      });
      toast.success("Saved.");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!token || !confirm("Remove this gallery item?")) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/gallery/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Removed.");
      load();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const reorder = async (id: string, direction: "up" | "down") => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/gallery/${id}/reorder`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error("Failed");
      if (Array.isArray(data)) setItems(data);
      else load();
    } catch {
      toast.error("Could not reorder.");
    }
  };

  const updateLocal = (id: string, field: keyof GalleryRow, value: string | boolean) => {
    setItems((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)),
    );
  };

  const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Images className="h-7 w-7 text-accent" />
        <h1 className="font-serif text-2xl text-foreground">Gallery</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl">
        Add images (upload or URL) or YouTube videos. Drag order with Up/Down. Only active items appear on the public{" "}
        <a href="/gallery" className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
          Gallery
        </a>{" "}
        page.
      </p>

      <div className="rounded-xl border border-border/60 bg-card/40 p-5 mb-10 max-w-2xl">
        <h2 className="font-medium text-foreground mb-4">Add item</h2>
        <Tabs value={addKind} onValueChange={(v) => setAddKind(v as "image" | "youtube")}>
          <TabsList className="mb-4">
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="space-y-3">
            <div className="space-y-2">
              <Label>Upload file</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAddImageFile(e.target.files?.[0] || null)}
                className="h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">or</p>
            <div className="space-y-2">
              <Label>Image URL (https://…)</Label>
              <Input
                value={addImageUrl}
                onChange={(e) => setAddImageUrl(e.target.value)}
                placeholder="https://…"
                className="h-11"
              />
            </div>
          </TabsContent>
          <TabsContent value="youtube" className="space-y-3">
            <div className="space-y-2">
              <Label>YouTube link</Label>
              <Input
                value={addYoutubeUrl}
                onChange={(e) => setAddYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
                className="h-11"
              />
            </div>
          </TabsContent>
        </Tabs>
        <div className="space-y-2 mt-4">
          <Label>Title (optional)</Label>
          <Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2 mt-3">
          <Label>Caption (optional)</Label>
          <Textarea value={addCaption} onChange={(e) => setAddCaption(e.target.value)} rows={2} />
        </div>
        <Button className="mt-4" disabled={saving} onClick={() => void addItem()}>
          {saving ? "Adding…" : "Add to gallery"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-8">No items yet. Add an image or video above.</p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="text-left p-3 font-medium w-[100px]">Preview</th>
                <th className="text-left p-3 font-medium">Details</th>
                <th className="text-left p-3 font-medium">Order</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={row._id} className="border-b border-border/40 align-top">
                  <td className="p-3 w-[100px]">
                    {row.kind === "youtube" && row.youtubeVideoId ? (
                      <img
                        src={ytThumb(row.youtubeVideoId)}
                        alt=""
                        className="w-20 h-14 object-cover rounded-md border border-border/50"
                      />
                    ) : row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="w-20 h-14 object-cover rounded-md border border-border/50"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 space-y-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {row.kind === "youtube" ? "Video" : "Image"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.active}
                          onCheckedChange={(c) => updateLocal(row._id, "active", c)}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                    <Input
                      value={row.title}
                      onChange={(e) => updateLocal(row._id, "title", e.target.value)}
                      placeholder="Title"
                      className="h-9"
                    />
                    <Textarea
                      value={row.caption}
                      onChange={(e) => updateLocal(row._id, "caption", e.target.value)}
                      placeholder="Caption"
                      rows={2}
                      className="text-xs"
                    />
                    {row.kind === "youtube" && (
                      <Input
                        value={row.youtubeUrl || ""}
                        onChange={(e) => updateLocal(row._id, "youtubeUrl", e.target.value)}
                        placeholder="YouTube URL"
                        className="h-9 text-xs font-mono"
                      />
                    )}
                    <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void saveRow(row._id)}>
                      Save changes
                    </Button>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0}
                        onClick={() => void reorder(row._id, "up")}
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === items.length - 1}
                        onClick={() => void reorder(row._id, "down")}
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void deleteItem(row._id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
