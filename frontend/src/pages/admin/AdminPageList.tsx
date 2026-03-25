import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type Page = {
  _id: string;
  title: string;
  slug: string;
  parent?: string | null;
  order: number;
  updatedAt?: string;
};

const AdminPageList = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAdmin();

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/admin/pages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPages(Array.isArray(data) ? data : []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this page?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/pages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPages((prev) => prev.filter((p) => p._id !== id));
      toast.success("Page deleted.");
    } catch {
      toast.error("Failed to delete page.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-accent" />
        <h1 className="font-serif text-2xl text-foreground">All Pages</h1>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : pages.length === 0 ? (
        <p className="text-muted-foreground py-8">No pages yet. Add one from the sidebar.</p>
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
              {pages.map((page) => (
                <tr key={page._id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="p-3 font-medium max-w-[200px] truncate">{page.title}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">/{page.slug}</td>
                  <td className="p-3 text-muted-foreground">
                    {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-8">
                          View
                        </Button>
                      </a>
                      <Link to={`/admin/pages/${page._id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(page._id)}
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

export default AdminPageList;
