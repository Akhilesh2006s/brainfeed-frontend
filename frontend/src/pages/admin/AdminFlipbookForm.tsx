import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

function slugFromTitle(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "flipbook"
  );
}

const AdminFlipbookForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAdmin();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!title && !isEdit) setSlug("");
    else if (!isEdit) setSlug(slugFromTitle(title));
  }, [title, isEdit]);

  useEffect(() => {
    if (isEdit && id && token) {
      fetch(buildApiUrl(`/admin/flipbooks/${id}`), { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((fb: { title?: string; slug?: string; pdfUrl?: string } | null) => {
          if (!fb) return;
          setTitle(String(fb.title || ""));
          setSlug(String(fb.slug || ""));
          setExistingPdfUrl(String(fb.pdfUrl || ""));
        })
        .catch(() => toast.error("Failed to load flipbook"))
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!isEdit && !pdfFile) {
      toast.error("Please choose a PDF file.");
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("slug", slug.trim() || slugFromTitle(title));
        fd.append("pdf", pdfFile!);
        const res = await fetch(buildApiUrl("/admin/flipbooks"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(
              "Flipbooks API returned 404 — the deployed backend is missing this route. On Railway set Root Directory to `backend`, redeploy from latest code, then open /api/capabilities on your API URL (should show flipbooks: true).",
            );
          }
          throw new Error((data as { error?: string }).error || "Failed to create");
        }
        toast.success("Flipbook created.");
        navigate("/admin/flipbooks");
        return;
      }

      const res = await fetch(buildApiUrl(`/admin/flipbooks/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || slugFromTitle(title),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update");

      if (pdfFile) {
        const fd = new FormData();
        fd.append("pdf", pdfFile);
        const up = await fetch(buildApiUrl(`/admin/flipbooks/${id}/pdf`), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error((upData as { error?: string }).error || "Failed to replace PDF");
      }

      toast.success("Flipbook saved.");
      navigate("/admin/flipbooks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-accent" />
        <h1 className="font-serif text-2xl text-foreground">{isEdit ? "Edit flipbook" : "New flipbook"}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a PDF. It will appear at{" "}
        <code className="text-xs bg-muted px-1 rounded">/flipbook/your-slug</code> with page-turning, zoom, full
        screen, and share — similar to a magazine viewer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="fb-title">Title</Label>
          <Input
            id="fb-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brainfeed Magazine February 2026"
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="fb-slug">URL slug</Label>
          <Input
            id="fb-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="brainfeed-magazine-february-2026"
            className="mt-1.5 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Public URL: /flipbook/{slug || slugFromTitle(title || "title")}</p>
        </div>
        <div>
          <Label htmlFor="fb-pdf">PDF file {!isEdit ? "(required)" : "(optional — replace)"}</Label>
          <Input
            id="fb-pdf"
            type="file"
            accept="application/pdf"
            className="mt-1.5 cursor-pointer"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          />
          {isEdit && existingPdfUrl && (
            <p className="text-xs text-muted-foreground mt-2 break-all">
              Current file:{" "}
              <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                Open PDF
              </a>
            </p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create flipbook"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/flipbooks")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminFlipbookForm;
