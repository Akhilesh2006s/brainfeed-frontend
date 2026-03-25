import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Newspaper, Package, CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const howDidYouHearOptions = [
  { value: "none", label: "Select an option" },
  { value: "search", label: "Search engine (Google, etc.)" },
  { value: "social", label: "Social media" },
  { value: "referral", label: "Friend or colleague" },
  { value: "magazine", label: "Brainfeed magazine" },
  { value: "event", label: "Conference or event" },
  { value: "other", label: "Other" },
];

type SubscriptionStatus = "processing" | "active" | "delivered" | "expired";

type SubscriptionSummary = {
  id: string;
  label: string;
  plan: string;
  status: SubscriptionStatus;
  orderId: string;
  nextIssue?: string;
  lastDelivered?: string;
};

const mockSubscriptions: SubscriptionSummary[] = [
  {
    id: "bf-main",
    label: "Brainfeed Magazine",
    plan: "Annual print subscription · Educator edition",
    status: "processing",
    orderId: "BF-2026-001",
    nextIssue: "Dispatching before 20 March 2026",
  },
  {
    id: "bf-primary",
    label: "Brainfeed Primary I",
    plan: "Classroom Pack · 30 copies / month",
    status: "active",
    orderId: "BF-2026-002",
    nextIssue: "Next issue: March 2026",
    lastDelivered: "February 2026 issue delivered",
  },
  {
    id: "bf-junior",
    label: "Brainfeed Junior",
    plan: "Library Pack · 1 copy / month",
    status: "delivered",
    orderId: "BF-2025-118",
    lastDelivered: "2025 cycle completed",
  },
];

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; tone: string; Icon: typeof CheckCircle2 }
> = {
  processing: {
    label: "Processing",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
    Icon: Clock3,
  },
  active: {
    label: "Active",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  delivered: {
    label: "Completed",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    Icon: AlertCircle,
  },
};

const Profile = () => {
  const { user, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("none");
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/", { replace: true });
      return;
    }
    if (user) {
      setName(user.name || "");
      setHowDidYouHear(user.howDidYouHear && user.howDidYouHear !== "none" ? user.howDidYouHear : "none");
      setWantsUpdates(user.wantsUpdates !== false);
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim(),
      howDidYouHear: howDidYouHear && howDidYouHear !== "none" ? howDidYouHear : undefined,
      wantsUpdates,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Profile updated.");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-sans">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        <section className="py-10 md:py-16 border-b border-border/60">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
            >
              <div>
                <div className="inline-flex items-center gap-2 text-accent mb-3">
                  <Newspaper className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Brainfeed Account
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl text-foreground">
                  Welcome, {user.name || "Reader"}
                </h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground font-sans max-w-xl">
                  Manage your profile, newsletter preferences, and keep track of your Brainfeed
                  magazine subscriptions in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-sans">
                <div className="px-3 py-2 rounded-full bg-secondary text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="px-3 py-2 rounded-full bg-secondary text-muted-foreground">
                  Updates:{" "}
                  <span className="font-medium text-foreground">
                    {wantsUpdates ? "Subscribed" : "Not subscribed"}
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
              {/* Profile + preferences */}
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/60 bg-card/70 p-6 md:p-8 shadow-sm space-y-5"
              >
                <h2 className="font-serif text-xl md:text-2xl text-foreground mb-1">
                  Account details
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Update your basic information and communication preferences.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-foreground font-medium">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 rounded-lg"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={user.email}
                      readOnly
                      className="pl-10 h-11 rounded-lg bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">How did you hear about us?</Label>
                  <Select value={howDidYouHear} onValueChange={setHowDidYouHear}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {howDidYouHearOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-muted/40 px-3 py-3">
                  <Checkbox
                    id="profile-updates"
                    checked={wantsUpdates}
                    onCheckedChange={(checked) => setWantsUpdates(checked === true)}
                  />
                  <div>
                    <Label
                      htmlFor="profile-updates"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Email updates from Brainfeed
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receive curated stories, exam updates, and magazine highlights. We send a few
                      handpicked mails a month—no spam.
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-lg bg-accent text-accent-foreground font-semibold uppercase tracking-wider"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </motion.form>

              {/* Subscription overview */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-border/60 bg-card/70 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-lg text-foreground">Subscriptions</h2>
                    <Link
                      to="/subscribe"
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-accent hover:text-accent/80"
                    >
                      Manage packs
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    This section summarises your Brainfeed magazine packs and delivery status.
                    (Order integration can connect here.)
                  </p>
                  <div className="space-y-3">
                    {mockSubscriptions.map((sub) => {
                      const cfg = statusConfig[sub.status];
                      const Icon = cfg.Icon;
                      const isDelivered = sub.status === "delivered" || sub.status === "expired";
                      const statusLine =
                        !isDelivered && sub.nextIssue
                          ? sub.nextIssue
                          : !isDelivered
                          ? "Order confirmed – awaiting next dispatch."
                          : sub.lastDelivered || "Subscription cycle completed.";

                      return (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-border/60 bg-card/80 p-3.5 flex gap-3"
                        >
                          <div className="mt-0.5">
                            <Package className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {sub.label}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {sub.plan}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] border ${cfg.tone}`}
                              >
                                <Icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                              <span>Order ID: {sub.orderId}</span>
                              <span>
                                {isDelivered ? "Order details: " : "Order status: "}
                                {statusLine}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-4 md:p-5 text-xs text-muted-foreground font-sans">
                  <p className="font-semibold text-foreground mb-1">
                    Coming soon: live order tracking
                  </p>
                  <p>
                    Your dashboard is ready for detailed order and delivery data—once connected to
                    your subscription backend, each card here can show exact dispatch dates, courier
                    details, and payment history.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
