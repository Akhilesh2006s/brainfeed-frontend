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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-6 w-6 text-accent shrink-0" />
        <h1 className="font-serif text-2xl text-foreground">All Pages</h1>
      </div>

      <div className="mb-6 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Filter by last updated
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5 w-full sm:w-44">
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
          <div className="space-y-1.5 w-full sm:w-36">
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
              className="h-10 w-full sm:w-auto shrink-0"
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
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : pages.length === 0 ? (
        <p className="text-muted-foreground py-8">No pages yet. Add one from the sidebar.</p>
      ) : (
        <>
          {filtersActive && (
            <p className="text-xs text-muted-foreground mb-3">
              Showing {filteredPages.length} of {pages.length} page{pages.length === 1 ? "" : "s"} (by updated date)
            </p>
          )}
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
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No pages match this month and year. Try different filters or{" "}
                      <button
                        type="button"
                        className="text-accent underline underline-offset-2 font-medium"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPageList;
