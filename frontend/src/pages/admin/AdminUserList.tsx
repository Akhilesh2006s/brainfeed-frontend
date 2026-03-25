import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { buildApiUrl } from "@/lib/apiUrl";

function displayNameFromEmail(email: string) {
  const local = String(email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!local) return "";
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type AdminUser = {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "editor";
  createdAt?: string;
};

const AdminUserList = () => {
  const { token } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [savingNameFor, setSavingNameFor] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(buildApiUrl("/admin/users"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        const mapped: AdminUser[] = (Array.isArray(data) ? data : []).map((a) => ({
          id: a.id || a._id,
          name: a.name,
          email: a.email,
          role: (a.role as "admin" | "editor") || "editor",
          createdAt: a.createdAt,
        }));
        setUsers(mapped);
      })
      .catch(() => {
        toast.error("Failed to load users.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setNameDrafts((prev) => {
      const next = { ...prev };
      for (const u of users) {
        if (next[u.id] === undefined) next[u.id] = u.name ?? "";
      }
      for (const id of Object.keys(next)) {
        if (!users.some((u) => u.id === id)) delete next[id];
      }
      return next;
    });
  }, [users]);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(buildApiUrl("/admin/users"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        const mapped: AdminUser[] = (Array.isArray(data) ? data : []).map((a) => ({
          id: a.id || a._id,
          name: a.name,
          email: a.email,
          role: (a.role as "admin" | "editor") || "editor",
          createdAt: a.createdAt,
        }));
        setUsers(mapped);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!email.trim() || !password.trim()) {
      toast.error("Enter email and password.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(buildApiUrl("/admin/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create user.");
      } else {
        toast.success("User created.");
        setName("");
        setEmail("");
        setPassword("");
        setRole("editor");
        refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async (userId: string) => {
    if (!token) return;
    const next = (nameDrafts[userId] ?? "").trim();
    setSavingNameFor(userId);
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update name.");
        return;
      }
      const saved = typeof data.name === "string" ? data.name : "";
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, name: saved } : u)),
      );
      setNameDrafts((prev) => ({ ...prev, [userId]: saved }));
      toast.success("Name updated.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSavingNameFor(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "editor") => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update role.");
      } else {
        toast.success("Role updated.");
        refresh();
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handlePasswordUpdate = async (userId: string) => {
    if (!token) return;
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        return;
      }

      toast.success("Password updated.");
      setChangingPasswordFor(null);
      setNewPassword("");
      refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user.");
      } else {
        toast.success("User deleted.");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage admin and editor accounts for the Brainfeed admin panel.
        </p>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-border/60 bg-card/60 p-4 md:p-5 grid gap-4 md:grid-cols-[1.5fr,2fr,2fr,1fr,auto] items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="new-name">
            Name
          </label>
          <Input
            id="new-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Editor name"
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="new-email">
            Email
          </label>
          <Input
            id="new-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="editor@example.com"
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="new-password">
            Password
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <Select value={role} onValueChange={(v) => setRole(v as "admin" | "editor")}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={saving} className="h-9 text-xs font-semibold uppercase tracking-[0.18em]">
          {saving ? "Saving…" : "Add user"}
        </Button>
      </form>

      <div className="rounded-xl border border-border/60 bg-card/60">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Existing users</p>
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
        </div>
        <div className="divide-y divide-border/60">
          {users.length === 0 && !loading ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1 max-w-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Display name for ${user.email}`}
                      value={nameDrafts[user.id] ?? user.name ?? ""}
                      onChange={(e) =>
                        setNameDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      placeholder={displayNameFromEmail(user.email) || "Display name"}
                      className="h-8 text-sm max-w-[220px]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={savingNameFor === user.id}
                      onClick={() => handleNameSave(user.id)}
                    >
                      {savingNameFor === user.id ? "Saving…" : "Save name"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown as:{" "}
                    <span className="text-foreground font-medium">
                      {(nameDrafts[user.id] ?? user.name)?.trim() ||
                        displayNameFromEmail(user.email) ||
                        user.email}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role} {user.createdAt && `· ${new Date(user.createdAt).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select
                    value={user.role}
                    onValueChange={(v) => handleRoleChange(user.id, v as "admin" | "editor")}
                  >
                    <SelectTrigger className="h-8 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  {user.role === "editor" && changingPasswordFor !== user.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setChangingPasswordFor(user.id)}
                    >
                      Set password
                    </Button>
                  ) : null}

                  {user.role === "editor" && changingPasswordFor === user.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="h-8 w-40"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={savingPassword}
                        onClick={() => handlePasswordUpdate(user.id)}
                      >
                        {savingPassword ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={savingPassword}
                        onClick={() => {
                          setChangingPasswordFor(null);
                          setNewPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserList;

