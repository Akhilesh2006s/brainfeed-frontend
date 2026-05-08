import { useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, CheckCircle2, AlertCircle, Clock3, RefreshCw, Eye, Printer, Download, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { buildApiUrl } from "@/lib/apiUrl";
import magazineCover from "@/assets/magazine-cover.jpg";

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
  billingAddress?: {
    fullAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    contact?: string;
    contactName?: string;
    organizationName?: string;
    country?: string;
  };
  shippingAddress?: {
    fullAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    contact?: string;
    contactName?: string;
    organizationName?: string;
    country?: string;
  };
  items?: Array<{
    name?: string;
    quantity?: number;
    price?: number;
    imageUrl?: string;
  }>;
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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

const normalizeAddressBlock = (
  value: Subscription["billingAddress"] | Subscription["shippingAddress"] | undefined,
  fallbackDelivery?: Subscription["deliveryAddress"],
  fallbackNotes?: string,
) => {
  const legacy = getDeliveryDetails(fallbackDelivery, fallbackNotes);
  const fullAddress = String(value?.fullAddress || legacy.address || "").trim();
  const city = String(value?.city || "").trim();
  const state = String(value?.state || "").trim();
  const pincode = String(value?.pincode || legacy.pin || "").trim();
  const email = String(value?.email || "").trim();
  const contact = String(value?.contact || legacy.mobile || "").trim();
  const contactName = String(value?.contactName || "").trim();
  const organizationName = String(value?.organizationName || "").trim();
  const country = String(value?.country || "India").trim();
  return {
    fullAddress,
    city,
    state,
    pincode,
    email,
    contact,
    contactName,
    organizationName,
    country,
  };
};

const normalizeProductName = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\bannual\b/g, "")
    .replace(/\bcombo\b/g, "")
    .replace(/\bpack\b/g, "")
    .replace(/\bsubscription\b/g, "")
    .replace(/\s*x\s*\d+$/i, "")
    .replace(/[()_\-–—]+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const AdminSubscriptionList = () => {
  const { token } = useAdmin();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [invoiceSub, setInvoiceSub] = useState<Subscription | null>(null);
  const [productImageMap, setProductImageMap] = useState<Record<string, string>>({});
  const [defaultProductImage, setDefaultProductImage] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);

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
          billingAddress: s.billingAddress,
          shippingAddress: s.shippingAddress,
          items: Array.isArray(s.items) ? s.items : [],
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

  useEffect(() => {
    fetch(buildApiUrl("/products"), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: any[]) => {
        const map: Record<string, string> = {};
        let firstImage = "";
        for (const row of Array.isArray(rows) ? rows : []) {
          const imageUrl = String(row?.imageUrl || "").trim();
          if (!imageUrl) continue;
          if (!firstImage) firstImage = imageUrl;
          const nameKey = normalizeProductName(row?.name);
          const slugKey = normalizeProductName(row?.slug);
          const tagKey = normalizeProductName(row?.tag);
          const badgeKey = normalizeProductName(row?.badge);
          const keys = [nameKey, slugKey, tagKey, badgeKey].filter(Boolean);
          for (const key of keys) {
            if (!map[key]) map[key] = imageUrl;
          }
        }
        setProductImageMap(map);
        setDefaultProductImage(firstImage || magazineCover);
      })
      .catch(() => {
        setProductImageMap({});
        setDefaultProductImage(magazineCover);
      });
  }, []);

  const resolveProductImage = (name: string, existingImage?: string) => {
    const direct = String(existingImage || "").trim();
    if (direct) return direct;
    const key = normalizeProductName(name);
    if (!key) return defaultProductImage;
    const exact = productImageMap[key];
    if (exact) return exact;
    const keyParts = key.split(" ").filter(Boolean);
    let bestUrl = "";
    let bestScore = 0;
    for (const [candidate, url] of Object.entries(productImageMap)) {
      if (!candidate || !url) continue;
      if (candidate.includes(key) || key.includes(candidate)) {
        const score = Math.min(candidate.length, key.length) + 50;
        if (score > bestScore) {
          bestScore = score;
          bestUrl = url;
        }
        continue;
      }
      const overlap = keyParts.filter((part) => part.length >= 3 && candidate.includes(part)).length;
      if (overlap > 0) {
        const score = overlap * 10 + Math.min(candidate.length, key.length);
        if (score > bestScore) {
          bestScore = score;
          bestUrl = url;
        }
      }
    }
    return bestUrl || defaultProductImage;
  };

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

  const getInvoiceNumber = (sub: Subscription) => `INV-${String(sub.id).slice(-8).toUpperCase()}`;
  const getOrderNumber = (sub: Subscription) => `#${String(sub.id).slice(-6).toUpperCase()}`;
  const formatOrderDate = (sub: Subscription) =>
    sub.createdAt
      ? new Date(sub.createdAt).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

  const buildInvoiceLineItems = (sub: Subscription) => {
    const rows =
      Array.isArray(sub.items) && sub.items.length
        ? sub.items
            .map((item) => ({
              name: String(item?.name || "").trim(),
              quantity: Math.max(1, Number(item?.quantity) || 1),
              price: Math.max(0, Number(item?.price) || 0),
              imageUrl: String(item?.imageUrl || "").trim(),
            }))
            .filter((item) => item.name)
        : [];
    if (rows.length > 0) {
      return rows.map((item) => {
        const fallback = resolveProductImage(item.name, item.imageUrl);
        return { ...item, imageUrl: fallback };
      });
    }
    const fallbackPrice = Math.max(0, Number(sub.total || 0));
    const fallbackName = String(sub.planName || "Subscription");
    return [
      {
        name: fallbackName,
        quantity: 1,
        price: fallbackPrice,
        imageUrl: resolveProductImage(fallbackName),
      },
    ];
  };

  const buildInvoiceHtml = (sub: Subscription) => {
    const billing = normalizeAddressBlock(sub.billingAddress, sub.deliveryAddress, sub.notes);
    const shipping = normalizeAddressBlock(sub.shippingAddress, sub.deliveryAddress, sub.notes);
    const invoiceNumber = getInvoiceNumber(sub);
    const issueDate = formatOrderDate(sub);
    const safeOrderNo = escapeHtml(getOrderNumber(sub));
    const lineItems = buildInvoiceLineItems(sub);
    const itemRowsHtml = lineItems
      .map((item) => {
        const lineTotal = item.price * item.quantity;
        return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                  ${
                    item.imageUrl
                      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
                      : `<span style="font-size:11px;color:#9ca3af;">Item</span>`
                  }
                </div>
                <span>${escapeHtml(item.name)}</span>
              </div>
            </td>
            <td>${escapeHtml(formatCurrency(item.price, sub.currency || "INR"))}</td>
            <td>${item.quantity}</td>
            <td>${escapeHtml(formatCurrency(lineTotal, sub.currency || "INR"))}</td>
          </tr>`;
      })
      .join("");
    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAmount = Math.max(0, Number(sub.total || 0) - subtotal);
    const safeStatus = escapeHtml(statusMeta[sub.status]?.label || "Pending");
    const safePayment = escapeHtml(formatPaymentStatus(sub.paymentStatus));
    const safeMethod = escapeHtml(sub.paymentMethod || "—");
    const safeTotal = escapeHtml(formatCurrency(Number(sub.total || 0), sub.currency || "INR"));
    const safeSubtotal = escapeHtml(formatCurrency(subtotal, sub.currency || "INR"));
    const safeShipping = escapeHtml(formatCurrency(shippingAmount, sub.currency || "INR"));

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Order ${safeOrderNo} - ${issueDate}</title>
    <style>
      body { font-family: Inter, Arial, Helvetica, sans-serif; color: #1f2937; background: #f7f8fa; margin: 0; padding: 24px; }
      .wrap { max-width: 980px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
      .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
      .muted { color: #6b7280; }
      .content { padding: 16px 20px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 12px; background: #fff; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #f9fafb; font-weight: 600; }
      .small { font-size: 12px; line-height: 1.5; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
      .summary { margin-left: auto; width: 280px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
      .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
      .order-total { font-weight: 700; font-size: 15px; color: #111827; border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <div style="font-size: 24px; font-weight: 700;">Order ${safeOrderNo} - ${issueDate}</div>
        <div class="small muted" style="text-align:right;">Invoice: ${invoiceNumber}</div>
      </div>
      <div class="content">
        <div class="two-col">
          <div class="card small">
            <div style="font-weight:700; font-size:16px; margin-bottom:8px;">Billing details</div>
            <div>${escapeHtml(billing.contactName || sub.userName || "—")}</div>
            <div>${escapeHtml(billing.organizationName || "—")}</div>
            <div>${escapeHtml(billing.fullAddress || "—")}</div>
            <div>${escapeHtml([billing.city, billing.state, billing.pincode].filter(Boolean).join(", ") || "—")}</div>
            <div>${escapeHtml(billing.country || "India")}</div>
            <div style="margin-top:10px;"><strong>Email</strong><br/>${escapeHtml(billing.email || sub.email || "—")}</div>
            <div style="margin-top:8px;"><strong>Phone</strong><br/>${escapeHtml(billing.contact || "—")}</div>
            <div style="margin-top:8px;"><strong>Payment via</strong><br/>${safeMethod}</div>
          </div>
          <div class="card small">
            <div style="font-weight:700; font-size:16px; margin-bottom:8px;">Shipping details</div>
            <div>${escapeHtml(shipping.contactName || sub.userName || "—")}</div>
            <div>${escapeHtml(shipping.organizationName || "—")}</div>
            <div>${escapeHtml(shipping.fullAddress || "—")}</div>
            <div>${escapeHtml([shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ") || "—")}</div>
            <div>${escapeHtml(shipping.country || "India")}</div>
            <div style="margin-top:10px;"><strong>Shipping method</strong><br/>Flat rate</div>
            <div style="margin-top:8px;"><strong>Email</strong><br/>${escapeHtml(shipping.email || sub.email || "—")}</div>
            <div style="margin-top:8px;"><strong>Phone</strong><br/>${escapeHtml(shipping.contact || "—")}</div>
          </div>
        </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>
      <div class="card small" style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
        <div><strong>Flat rate</strong><div class="muted">Items: ${escapeHtml(lineItems.map((i) => `${i.name} x ${i.quantity}`).join(", "))}</div></div>
        <div>${safeShipping}</div>
      </div>
      <div class="summary">
        <div class="summary-row"><span>Items Subtotal:</span><span>${safeSubtotal}</span></div>
        <div class="summary-row"><span>Shipping:</span><span>${safeShipping}</span></div>
        <div class="summary-row order-total"><span>Order Total:</span><span>${safeTotal}</span></div>
      </div>
      </div>
    </div>
  </body>
</html>`;
  };

  const handlePrintInvoice = (sub: Subscription) => {
    const html = buildInvoiceHtml(sub);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      toast.error("Unable to open invoice preview window.");
      URL.revokeObjectURL(url);
      return;
    }
    w.addEventListener("load", () => {
      w.print();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
  };

  const handleDownloadInvoice = async (sub: Subscription) => {
    const target = invoicePreviewRef.current;
    if (!target) {
      toast.error("Invoice preview is not ready yet.");
      return;
    }
    setDownloadingInvoice(true);
    let container: HTMLDivElement | null = null;
    try {
      const cloned = target.cloneNode(true) as HTMLDivElement;
      cloned.querySelectorAll('[data-pdf-exclude="true"]').forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = `${Math.max(target.scrollWidth, 900)}px`;
      container.style.background = "#ffffff";
      container.style.padding = "0";
      container.style.zIndex = "-1";
      container.appendChild(cloned);
      document.body.appendChild(container);

      const canvas = await html2canvas(cloned, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
      pdf.save(`${getInvoiceNumber(sub)}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      setDownloadingInvoice(false);
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
                  <th className="text-left p-3 font-medium hidden md:table-cell">Payment</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Created</th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Status</th>
                  <th className="text-center p-3 font-medium">Invoice</th>
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
                      <td className="p-3 align-top text-xs text-muted-foreground hidden sm:table-cell">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="p-3 align-top text-sm text-foreground">
                        {s.total ? formatCurrency(s.total, s.currency) : "—"}
                      </td>
                      <td className="p-3 align-top hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] border ${cfg.tone}`}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 align-top text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setInvoiceSub(s)}
                          title="Preview invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <Dialog open={Boolean(invoiceSub)} onOpenChange={(open) => !open && setInvoiceSub(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Invoice Preview</DialogTitle>
            <DialogDescription>
              Review invoice details, then print or download.
            </DialogDescription>
          </DialogHeader>

          {invoiceSub && (
            <div ref={invoicePreviewRef} className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/70 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-border/60">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    Order {getOrderNumber(invoiceSub)} - {formatOrderDate(invoiceSub)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-white p-4">
                  <p className="font-semibold text-foreground mb-3">Billing details</p>
                  {(() => {
                    const billing = normalizeAddressBlock(invoiceSub.billingAddress, invoiceSub.deliveryAddress, invoiceSub.notes);
                    return (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="text-foreground">{billing.contactName || invoiceSub.userName || "—"}</p>
                        <p>{billing.organizationName || "—"}</p>
                        <p className="whitespace-pre-wrap">{billing.fullAddress || "—"}</p>
                        <p>{[billing.city, billing.state, billing.pincode].filter(Boolean).join(", ") || "—"}</p>
                        <p>{billing.country || "India"}</p>
                        <div className="pt-2">
                          <p className="font-semibold text-foreground">Email</p>
                          <p>{billing.email || invoiceSub.email || "—"}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Phone</p>
                          <p>{billing.contact || "—"}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Payment via</p>
                          <p>{invoiceSub.paymentMethod || "Credit Card / Debit Card / NetBanking"}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="rounded-lg border border-border/60 bg-white p-4">
                  <p className="font-semibold text-foreground mb-3">Shipping details</p>
                  {(() => {
                    const shipping = normalizeAddressBlock(invoiceSub.shippingAddress, invoiceSub.deliveryAddress, invoiceSub.notes);
                    return (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="text-foreground">{shipping.contactName || invoiceSub.userName || "—"}</p>
                        <p>{shipping.organizationName || "—"}</p>
                        <p className="whitespace-pre-wrap">{shipping.fullAddress || "—"}</p>
                        <p>{[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ") || "—"}</p>
                        <p>{shipping.country || "India"}</p>
                        <div className="pt-2">
                          <p className="font-semibold text-foreground">Shipping method</p>
                          <p>Flat rate</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Email</p>
                          <p>{shipping.email || invoiceSub.email || "—"}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Phone</p>
                          <p>{shipping.contact || "—"}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Qty</th>
                      <th className="text-left p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildInvoiceLineItems(invoiceSub).map((item, idx) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <tr key={`${item.name}-${idx}`} className="border-b border-border/40">
                          <td className="p-3 text-foreground">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md border border-border/70 bg-muted/30 overflow-hidden flex items-center justify-center">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-foreground">{formatCurrency(item.price, invoiceSub.currency || "INR")}</td>
                          <td className="p-3 text-foreground">{item.quantity}</td>
                          <td className="p-3 text-foreground">{formatCurrency(lineTotal, invoiceSub.currency || "INR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Flat rate</p>
                      <p className="text-xs text-muted-foreground">
                        Items: {buildInvoiceLineItems(invoiceSub).map((item) => `${item.name} x ${item.quantity}`).join(", ")}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-foreground">
                    {formatCurrency(
                      Math.max(
                        0,
                        Number(invoiceSub.total || 0) -
                          buildInvoiceLineItems(invoiceSub).reduce((sum, item) => sum + item.price * item.quantity, 0),
                      ),
                      invoiceSub.currency || "INR",
                    )}
                  </p>
                </div>
                <div className="px-3 py-3 border-t border-border/60 flex justify-end">
                  <div className="w-full max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal:</span>
                      <span className="text-foreground">
                        {formatCurrency(
                          buildInvoiceLineItems(invoiceSub).reduce((sum, item) => sum + item.price * item.quantity, 0),
                          invoiceSub.currency || "INR",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping:</span>
                      <span className="text-foreground">
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(invoiceSub.total || 0) -
                              buildInvoiceLineItems(invoiceSub).reduce((sum, item) => sum + item.price * item.quantity, 0),
                          ),
                          invoiceSub.currency || "INR",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-foreground border-t border-border/60 pt-2 mt-2">
                      <span>Order Total:</span>
                      <span>{formatCurrency(Number(invoiceSub.total || 0), invoiceSub.currency || "INR")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2" data-pdf-exclude="true">
                <Button type="button" variant="outline" onClick={() => handlePrintInvoice(invoiceSub)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button type="button" onClick={() => handleDownloadInvoice(invoiceSub)} disabled={downloadingInvoice}>
                  {downloadingInvoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionList;

