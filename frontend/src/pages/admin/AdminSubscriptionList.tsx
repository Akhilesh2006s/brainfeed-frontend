import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, CheckCircle2, AlertCircle, Clock3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type SubscriptionStatus = "pending" | "processing" | "active" | "delivered" | "cancelled";

type Subscription = {
  id: string;
  userName?: string;
  email?: string;
  source?: string;
  planName: string;
  planType?: string;
  notes?: string;
  deliveryAddress?: {
    address?: string;
    pin?: string;
    mobile?: string;
    landline?: string;
    website?: string;
    institution?: string;
  };
  total: number;
  currency: string;
  status: SubscriptionStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryStatus?: string;
  createdAt?: string;
  deliveryExpectedAt?: string | null;
  deliveredAt?: string | null;
};

const statusMeta: Record<
  SubscriptionStatus,
  { label: string; tone: string; Icon: typeof CheckCircle2 }
> = {
  pending: {
    label: "Pending",
    tone: "bg-slate-100 text-slate-800 border-slate-200",
    Icon: Clock3,
  },
  processing: {
    label: "Processing",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
    Icon: RefreshCw,
  },
  active: {
    label: "Active",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  delivered: {
    label: "Delivered",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
    Icon: Truck,
  },
  cancelled: {
    label: "Cancelled",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    Icon: AlertCircle,
  },
};

const formatCurrency = (amount: number, currency = "INR") =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const formatPaymentStatus = (value?: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "—";
  const lowered = normalized.toLowerCase();
  if (lowered === "captured") return "Paid";
  if (lowered === "paid") return "Paid";
  if (lowered === "created") return "Created";
  if (lowered === "attempted") return "Attempted";
  if (lowered === "failed") return "Failed";
  if (lowered === "refunded") return "Refunded";
  if (lowered === "authorized") return "Authorized";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatSubscriberNotes = (value?: string) => {
  const parts = String(value || "")
    .split("|")
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .filter((part) => !/^(Items:|Mobile:|Method:)/i.test(part));

  if (parts.length === 0) return "";

  return Array.from(new Set(parts)).join(" | ");
};

const parseLegacyDeliveryDetails = (fallbackNotes?: string) => {
  const parts = String(fallbackNotes || "")
    .split("|")
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  let address = "";
  let pin = "";
  let mobile = "";
  let landline = "";
  let website = "";
  let institution = "";

  for (const part of parts) {
    if (!pin && /^PIN:/i.test(part)) {
      pin = part.replace(/^PIN:\s*/i, "").trim();
      continue;
    }
    if (!mobile && /^Mobile:/i.test(part)) {
      mobile = part.replace(/^Mobile:\s*/i, "").trim();
      continue;
    }
    if (!landline && /^Landline:/i.test(part)) {
      landline = part.replace(/^Landline:\s*/i, "").trim();
      continue;
    }
    if (!website && /^Website:/i.test(part)) {
      website = part.replace(/^Website:\s*/i, "").trim();
      continue;
    }
    if (!institution && /^Institution:/i.test(part)) {
      institution = part.replace(/^Institution:\s*/i, "").trim();
      continue;
    }
    if (!address && !/^(Items:|Method:)/i.test(part)) {
      address = part;
    }
  }

  return { address, pin, mobile, landline, website, institution };
};

const getDeliveryDetails = (value?: Subscription["deliveryAddress"], fallbackNotes?: string) => {
  const legacy = parseLegacyDeliveryDetails(fallbackNotes);
  return {
    address: String(value?.address || "").trim() || legacy.address,
    pin: String(value?.pin || "").trim() || legacy.pin,
    mobile: String(value?.mobile || "").trim() || legacy.mobile,
    landline: String(value?.landline || "").trim() || legacy.landline,
    website: String(value?.website || "").trim() || legacy.website,
    institution: String(value?.institution || "").trim() || legacy.institution,
  };
};

const formatDeliveryMobile = (value?: Subscription["deliveryAddress"], fallbackNotes?: string) => {
  const fromAddress = getDeliveryDetails(value, fallbackNotes).mobile;
  if (fromAddress) return fromAddress;
  return "";
};

const getDeliveryText = (sub: Subscription) => {
  const details = getDeliveryDetails(sub.deliveryAddress, sub.notes);
  if (details.address) return details.address;
  if (sub.deliveryStatus) return sub.deliveryStatus;
  if (sub.deliveryExpectedAt) {
    return `Expected: ${new Date(sub.deliveryExpectedAt).toLocaleDateString("en-IN")}`;
  }
  if (sub.deliveredAt) {
    return `Delivered: ${new Date(sub.deliveredAt).toLocaleDateString("en-IN")}`;
  }
  return "Address not available";
};

const AdminSubscriptionList = () => {
  const { token } = useAdmin();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");

  const load = () => {
    if (!token) return;
    setLoading(true);
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`${API_BASE}/api/admin/subscriptions${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        const mapped: Subscription[] = (Array.isArray(data) ? data : []).map((s) => ({
          id: s.id || s._id,
          userName: s.userName,
          email: s.email,
          source: s.source,
          planName: s.planName,
          planType: s.planType,
          notes: s.notes,
          deliveryAddress: s.deliveryAddress,
          total: s.total ?? 0,
          currency: s.currency || "INR",
          status: (s.status as SubscriptionStatus) || "pending",
          paymentStatus: s.paymentStatus,
          paymentMethod: s.paymentMethod,
          deliveryStatus: s.deliveryStatus,
          createdAt: s.createdAt,
          deliveryExpectedAt: s.deliveryExpectedAt,
          deliveredAt: s.deliveredAt,
        }));
        setSubs(mapped);
      })
      .catch(() => {
        toast.error("Failed to load subscriptions.");
        setSubs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const stats = useMemo(() => {
    const total = subs.length;
    const pending = subs.filter((s) => s.status === "pending" || s.status === "processing").length;
    const active = subs.filter((s) => s.status === "active").length;
    const delivered = subs.filter((s) => s.status === "delivered").length;
    const cancelled = subs.filter((s) => s.status === "cancelled").length;
    const revenue = subs.reduce((sum, s) => sum + (s.total || 0), 0);
    return { total, pending, active, delivered, cancelled, revenue };
  }, [subs]);

  const updateStatus = async (id: string, status: SubscriptionStatus) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update subscription.");
      } else {
        toast.success("Subscription updated.");
        setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1">Subscriptions overview</h1>
          <p className="text-sm text-muted-foreground">
            See all Brainfeed subscription orders and review Razorpay-backed payment details with delivery status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as SubscriptionStatus | "all")}
          >
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/70 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Total subscriptions
          </p>
          <p className="font-serif text-2xl text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            In progress
          </p>
          <p className="font-serif text-2xl text-foreground">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Active
          </p>
          <p className="font-serif text-2xl text-foreground">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Delivered
          </p>
          <p className="font-serif text-2xl text-foreground">{stats.delivered}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Est. value
          </p>
          <p className="font-serif text-2xl text-foreground">
            {formatCurrency(stats.revenue)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden">
        <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Recent orders</p>
          <p className="text-xs text-muted-foreground">
            Showing {subs.length} {statusFilter === "all" ? "orders" : `${statusFilter} orders`}
          </p>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading subscriptions…</p>
        ) : subs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No subscriptions found yet. Once the checkout flow is connected, web orders will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  <th className="text-left p-3 font-medium">Subscriber</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Payment</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Delivery</th>
                  <th className="text-left p-3 font-medium">Mobile</th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Update</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const cfg = statusMeta[s.status];
                  const Icon = cfg.Icon;
                  return (
                    <tr key={s.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="p-3 align-top">
                        <div className="text-sm font-medium text-foreground">
                          {s.userName || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {s.email || "—"}
                        </div>
                        {s.source && (
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                            Source: {s.source}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-sm font-medium text-foreground">
                          {s.planName}
                        </div>
                        {s.planType && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.planType}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-xs font-medium text-foreground">
                          {formatPaymentStatus(s.paymentStatus)}
                        </div>
                        {s.paymentMethod && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Method: {s.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top text-xs text-muted-foreground">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="p-3 align-top text-xs text-muted-foreground max-w-[360px] min-w-[220px]">
                        {(() => {
                          const details = getDeliveryDetails(s.deliveryAddress, s.notes);
                          if (details.address || details.pin || details.landline || details.website || details.institution) {
                            return (
                              <div className="space-y-0.5 whitespace-pre-wrap break-words">
                                {details.address && <div className="text-foreground/90">{details.address}</div>}
                                {details.pin && <div>PIN: {details.pin}</div>}
                                {details.landline && <div>Landline: {details.landline}</div>}
                                {details.website && <div>Website: {details.website}</div>}
                                {details.institution && <div>Institution: {details.institution}</div>}
                              </div>
                            );
                          }
                          return getDeliveryText(s);
                        })()}
                      </td>
                      <td className="p-3 align-top text-xs text-muted-foreground">
                        {formatDeliveryMobile(s.deliveryAddress, s.notes) || "—"}
                      </td>
                      <td className="p-3 align-top text-sm text-foreground">
                        {s.total ? formatCurrency(s.total, s.currency) : "—"}
                      </td>
                      <td className="p-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] border ${cfg.tone}`}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={s.status}
                            onValueChange={(v) => updateStatus(s.id, v as SubscriptionStatus)}
                            disabled={updatingId === s.id}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptionList;

