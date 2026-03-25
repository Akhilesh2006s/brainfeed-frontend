import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Flipbook = {
  _id: string;
  title: string;
  slug: string;
  pdfUrl?: string;
  updatedAt?: string;
};

const AdminFlipbookList = () => {
  const [items, setItems] = useState<Flipbook[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAdmin();

  useEffect(() => {
    if (!token) return;
    fetch(buildApiUrl("/admin/flipbooks"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 404) {
          toast.error(
            "Flipbooks API not found (404). Redeploy backend with Root Directory = backend. Test: your-api.railway.app/api/capabilities",
          );
          return [];
        }
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this flipbook?")) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/flipbooks/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((p) => p._id !== id));
      toast.success("Flipbook deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <h1 className="font-serif text-2xl text-foreground">Flipbooks (PDF)</h1>
        </div>
        <Link to="/admin/flipbooks/new">
          <Button>Add flipbook</Button>
        </Link>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-8">No flipbooks yet. Create one to publish a PDF magazine viewer.</p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Slug (URL)</th>
                <th className="text-left p-3 font-medium">Updated</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((fb) => (
                <tr key={fb._id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="p-3 font-medium max-w-[200px] truncate">{fb.title}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">/flipbook/{fb.slug}</td>
                  <td className="p-3 text-muted-foreground">
                    {fb.updatedAt ? new Date(fb.updatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/flipbook/${fb.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-8">
                          View
                        </Button>
                      </a>
                      <Link to={`/admin/flipbooks/${fb._id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(fb._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default AdminFlipbookList;
