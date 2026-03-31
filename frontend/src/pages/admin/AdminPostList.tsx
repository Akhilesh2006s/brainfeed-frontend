import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Newspaper, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { buildNewsPath } from "@/lib/seo";
import { buildApiUrl } from "@/lib/apiUrl";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NEWS_CATEGORIES = [
  "All",
  "Achievement",
  "Press Release",
  "Career",
  "Education",
  "Institutional Profile",
  "Internship",
  "Jobs",
  "Science & Environment",
  "Technology",
  "Expert View",
];

type Post = {
  _id: string;
  type: string;
  title: string;
  category: string;
  views: number;
  createdAt: string;
  status?: string;
  publishedBy?: {
    name?: string;
    email?: string;
  };
};

function formatListDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" });
}

/** Local calendar range [start of first day, start of day after last day) — matches Date column (en-IN). */
function dateRangeToQuery(range: DateRange | undefined): { start: string; end: string } | null {
  if (!range?.from) return null;
  let d0 = range.from;
  let d1 = range.to ?? range.from;
  if (d1 < d0) {
    const t = d0;
    d0 = d1;
    d1 = t;
  }
  const sy = d0.getFullYear();
  const sm = d0.getMonth();
  const sd = d0.getDate();
  const ey = d1.getFullYear();
  const em = d1.getMonth();
  const ed = d1.getDate();
  const start = new Date(sy, sm, sd, 0, 0, 0, 0);
  const endExclusive = new Date(ey, em, ed + 1, 0, 0, 0, 0);
  if (endExclusive.getTime() <= start.getTime()) return null;
  return { start: start.toISOString(), end: endExclusive.toISOString() };
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "All dates";
  const a = formatListDate(range.from);
  if (!range.to) return a;
  const b = formatListDate(range.to);
  return a === b ? a : `${a} – ${b}`;
}

const AdminPostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  /** all | published | draft — drafts are hidden from the public site */
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const { token } = useAdmin();
  /** Applied filter sent to the API (sidebar always reflects this after Apply). */
  const [dateRangeApplied, setDateRangeApplied] = useState<DateRange | undefined>(undefined);
  /** Draft while the calendar popover is open (Apply commits to applied). */
  const [dateRangeDraft, setDateRangeDraft] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("type", "news");
    if (statusFilter !== "all") {
      qs.set("status", statusFilter);
    }
    const q = dateRangeToQuery(dateRangeApplied);
    if (q) {
      qs.set("start", q.start);
      qs.set("end", q.end);
    }

    const url = buildApiUrl(`/admin/posts?${qs.toString()}`);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [token, dateRangeApplied, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this post?")) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/posts/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted.");
    } catch {
      toast.error("Failed to delete post.");
    }
  };
  const title = "News posts";
  const Icon = Newspaper;

  const filteredPosts =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-6 w-6 text-accent" />
        <h1 className="font-serif text-2xl text-foreground">{title}</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        View news articles and filter by category or status (drafts are not visible on the public site). Choose a
        start and end date (inclusive) to match the Date column; Apply runs the request. Clear removes the date filter.
      </p>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)] items-start">
          <aside className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Status
              </p>
              <div className="space-y-1 mb-4">
                {(
                  [
                    { id: "all" as const, label: "All posts" },
                    { id: "published" as const, label: "Published" },
                    { id: "draft" as const, label: "Drafts" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                      statusFilter === s.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Categories
              </p>
              <div className="space-y-1">
                {NEWS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                      activeCategory === cat
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/60 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Date range
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Select start, then end (or one day twice). Apply to load; Clear shows all posts.
              </p>
              <Popover
                open={calendarOpen}
                onOpenChange={(open) => {
                  setCalendarOpen(open);
                  if (open) setDateRangeDraft(dateRangeApplied);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal min-h-10 px-3 py-2 h-auto",
                      !dateRangeApplied?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    <span className="text-xs leading-snug break-words">{formatRangeLabel(dateRangeApplied)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRangeDraft?.from ?? dateRangeApplied?.from ?? new Date()}
                    selected={dateRangeDraft}
                    onSelect={setDateRangeDraft}
                    numberOfMonths={1}
                    initialFocus
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-border/60 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setDateRangeDraft(undefined);
                        setDateRangeApplied(undefined);
                        setCalendarOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!dateRangeDraft?.from}
                      onClick={() => {
                        setDateRangeApplied(dateRangeDraft);
                        setCalendarOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {dateRangeApplied?.from ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs h-8"
                  onClick={() => {
                    setDateRangeApplied(undefined);
                    setDateRangeDraft(undefined);
                    setCalendarOpen(false);
                  }}
                >
                  Clear date filter
                </Button>
              ) : null}
            </div>
          </aside>

          <div className="rounded-lg border border-border/60 overflow-hidden min-h-[200px]">
            {posts.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground text-center">
                {dateRangeApplied?.from ? (
                  <>
                    <p className="font-medium text-foreground mb-1">
                      No posts in {formatRangeLabel(dateRangeApplied)}
                    </p>
                    <p>Try another range or clear the date filter to see all posts.</p>
                  </>
                ) : statusFilter === "draft" ? (
                  <p>No drafts yet. Use <strong>Add news</strong> and click <strong>Save draft</strong>, or open a draft from when you saved earlier.</p>
                ) : (
                  <p>No posts yet. Add one from the sidebar.</p>
                )}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground text-center">
                <p className="font-medium text-foreground mb-1">No posts in this category</p>
                <p>Choose &ldquo;All&rdquo; or another category.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Editor</th>
                    <th className="text-left p-3 font-medium">Views</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post._id}
                      className="border-b border-border/40 hover:bg-muted/30"
                    >
                      <td className="p-3 font-medium max-w-[200px] truncate">{post.title}</td>
                      <td className="p-3">
                        {post.status === "draft" ? (
                          <span className="inline-flex rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            Draft
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Published</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{post.category}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {post.publishedBy?.name?.trim() || post.publishedBy?.email || "—"}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views ?? 0}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status !== "draft" ? (
                            <Link
                              to={buildNewsPath(post.title, post._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-8" aria-label="View article">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground" title="Publish the article to view on site">
                              <Eye className="h-4 w-4 opacity-40" />
                            </span>
                          )}
                          <Link to={`/admin/posts/${post._id}/edit?type=news`}>
                            <Button variant="ghost" size="sm" className="h-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(post._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostList;
