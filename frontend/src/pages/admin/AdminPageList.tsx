import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const MONTH_OPTIONS = [
  { value: "all", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function pageMatchesDateFilter(
  page: { updatedAt?: string },
  filterYear: string,
  filterMonth: string,
): boolean {
  if (filterYear === "all" && filterMonth === "all") return true;
  if (!page.updatedAt) return false;
  const d = new Date(page.updatedAt);
  if (Number.isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const yearOk = filterYear === "all" || String(y) === filterYear;
  const monthOk = filterMonth === "all" || String(m) === filterMonth;
  return yearOk && monthOk;
}

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
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const { token } = useAdmin();

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const p of pages) {
      if (!p.updatedAt) continue;
      const d = new Date(p.updatedAt);
      if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [pages]);

  const filteredPages = useMemo(
    () => pages.filter((p) => pageMatchesDateFilter(p, filterYear, filterMonth)),
    [pages, filterYear, filterMonth],
  );

  const filtersActive = filterYear !== "all" || filterMonth !== "all";

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 shrink-0 text-accent" />
          <h1 className="font-serif text-2xl text-foreground">All Pages</h1>
        </div>

        <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter by last updated
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full space-y-1.5 sm:w-44">
              <Label htmlFor="page-filter-month" className="text-xs text-muted-foreground">
                Month
              </Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger id="page-filter-month" className="h-10">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1.5 sm:w-36">
              <Label htmlFor="page-filter-year" className="text-xs text-muted-foreground">
                Year
              </Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger id="page-filter-year" className="h-10">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filtersActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-full shrink-0 sm:w-auto"
                onClick={() => {
                  setFilterYear("all");
                  setFilterMonth("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : pages.length === 0 ? (
        <p className="py-8 text-muted-foreground">No pages yet. Add one from the sidebar.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {filtersActive && (
            <p className="mb-3 shrink-0 text-xs text-muted-foreground">
              Showing {filteredPages.length} of {pages.length} page{pages.length === 1 ? "" : "s"} (by updated date)
            </p>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/60">
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Title</th>
                    <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Slug (URL)</th>
                    <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Updated</th>
                    <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No pages match this month and year. Try different filters or{" "}
                        <button
                          type="button"
                          className="font-medium text-accent underline underline-offset-2"
                          onClick={() => {
                            setFilterYear("all");
                            setFilterMonth("all");
                          }}
                        >
                          clear filters
                        </button>
                        .
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => (
                      <tr key={page._id} className="hover:bg-muted/30">
                        <td className="max-w-[200px] truncate border-b border-border/40 p-3 font-medium">{page.title}</td>
                        <td className="border-b border-border/40 p-3 font-mono text-xs text-muted-foreground">/{page.slug}</td>
                        <td className="border-b border-border/40 p-3 text-muted-foreground">
                          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="border-b border-border/40 p-3 text-right">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPageList;
