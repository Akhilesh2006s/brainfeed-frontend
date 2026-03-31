import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { Button } from "@/components/ui/button";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Row = {
  _id: string;
  email: string;
  source?: string;
  createdAt?: string;
};

const AdminNewsletterSubscribers = () => {
  const { token, isAdmin } = useAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token || !isAdmin) return;
    setLoading(true);
    fetch(buildApiUrl("/admin/newsletter-subscribers"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!token || !confirm("Remove this email from the list?")) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/newsletter-subscribers/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      setRows((prev) => prev.filter((r) => r._id !== id));
      toast.success("Removed.");
    } catch {
      toast.error("Could not remove.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-foreground">Newsletter emails</h1>
        <p className="text-sm text-muted-foreground max-w-xl">Only full admins can view newsletter sign-ups.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Mail className="h-7 w-7 text-accent" />
        <h1 className="font-serif text-2xl text-foreground">Newsletter emails</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Emails collected from the homepage &ldquo;Get the Free Newsletter&rdquo; form (and any other sources using the same
        API). Duplicates are not stored twice.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-8 rounded-lg border border-border/60 bg-card/40 px-4">
          No sign-ups yet. When visitors subscribe on the site, they will appear here.
        </p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Source</th>
                <th className="text-left p-3 font-medium">Registered</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs break-all">{r.email}</td>
                  <td className="p-3 text-muted-foreground">{r.source || "—"}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void remove(r._id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground p-3 border-t border-border/60 bg-muted/20">
            {rows.length} email{rows.length === 1 ? "" : "s"} total
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletterSubscribers;
