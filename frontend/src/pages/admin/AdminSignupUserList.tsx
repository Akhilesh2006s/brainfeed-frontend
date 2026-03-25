import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type SignupUser = {
  id: string;
  name: string;
  email: string;
  howDidYouHear?: string;
  wantsUpdates?: boolean;
  createdAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const AdminSignupUserList = () => {
  const { token, isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<SignupUser[]>([]);

  const canView = !!token && isAdmin;

  const mappedUsers = useMemo(() => users, [users]);

  const load = async (query: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/api/admin/signup-users`, window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      const res = await fetch(url.toString().replace(window.location.origin, ""), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load signup users.");
        setUsers([]);
        return;
      }
      const mapped: SignupUser[] = (Array.isArray(data) ? data : []).map((u: any) => ({
        id: u.id || u._id,
        name: u.name || "",
        email: u.email || "",
        howDidYouHear: u.howDidYouHear || "",
        wantsUpdates: u.wantsUpdates,
        createdAt: u.createdAt,
      }));
      setUsers(mapped);
    } catch {
      toast.error("Failed to load signup users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, token]);

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-foreground">Signup users</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Only Admin users can view the full list of website signup users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Signup users</h1>
            <p className="text-xs text-muted-foreground">
              People who created accounts on the Brainfeed website.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="h-9 md:w-72"
          />
          <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => load(q)} disabled={loading}>
            Search
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Users</p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (
            <p className="text-xs text-muted-foreground">{mappedUsers.length} total</p>
          )}
        </div>

        {mappedUsers.length === 0 && !loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">How did you hear</th>
                  <th className="text-left p-3 font-medium">Updates</th>
                  <th className="text-left p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {mappedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{u.name || "—"}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.howDidYouHear || "—"}</td>
                    <td className="p-3 text-xs">
                      {u.wantsUpdates === false ? (
                        <span className="inline-flex rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">Off</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">On</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignupUserList;

