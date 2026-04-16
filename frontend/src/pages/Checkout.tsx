import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { buildApiUrl } from "@/lib/apiUrl";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const formatRupees = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const isMagazineItem = (item: { id: string; name: string; category?: string }) => {
  if (item.category === "magazine") return true;
  return String(item.id || "").toLowerCase().startsWith("magazine-");
};

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const hasItems = items.length > 0;
  const [isPaying, setIsPaying] = useState(false);
  const orderLabel = useMemo(() => (items.length === 1 ? items[0].name : `Brainfeed order (${items.length} items)`), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const hasOnlyMagazines = useMemo(
    () => hasItems && items.every((item) => isMagazineItem(item)),
    [hasItems, items],
  );
  const shippingCharge = useMemo(
    () => (hasOnlyMagazines && totalQuantity === 1 ? 300 : 0),
    [hasOnlyMagazines, totalQuantity],
  );
  const totalAmount = subtotal + shippingCharge;

  const [details, setDetails] = useState({
    name: "",
    address: "",
    pin: "",
    mobile: "",
    landline: "",
    email: "",
    website: "",
    institution: "",
  });

  function validateDetails() {
    const requiredFields: Array<{ key: keyof typeof details; label: string }> = [
      { key: "name", label: "Name" },
      { key: "address", label: "Address" },
      { key: "pin", label: "Pin" },
      { key: "mobile", label: "Mobile No." },
      { key: "email", label: "Email" },
    ];

    for (const f of requiredFields) {
      const value = String(details[f.key] || "").trim();
      if (!value) {
        toast.error(`Please enter ${f.label}.`);
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-checkout-field="${f.key}"]`);
        el?.focus();
        return false;
      }
    }

    const email = details.email.trim();
    // Simple email guard (browser validation isn't triggered because the button is type="button")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email.");
      document.querySelector<HTMLInputElement>(`[data-checkout-field="email"]`)?.focus();
      return false;
    }

    return true;
  }

  async function handleCheckout() {
    try {
      if (!validateDetails()) return;
      setIsPaying(true);

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      const amountPaise = Math.round(totalAmount * 100);

      const orderRes = await fetch(buildApiUrl("/payments/razorpay/order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `bf_${Date.now()}`,
          notes: {
            customerName: details.name.trim(),
            customerEmail: details.email.trim(),
            customerMobile: details.mobile.trim(),
            address: details.address.trim(),
            pin: details.pin.trim(),
            landline: details.landline.trim(),
            website: details.website.trim(),
            institution: details.institution.trim(),
            items: items.map((i) => `${i.name}×${i.quantity}`).join(", "),
          },
        }),
      });

      const orderJson = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        toast.error(orderJson?.error || "Failed to start checkout");
        return;
      }

      const keyFromEnv = (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)?.trim();
      const key = keyFromEnv || orderJson.keyId;
      if (!key) {
        toast.error("Payment gateway key is missing. Set VITE_RAZORPAY_KEY_ID.");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: "Brainfeed",
        description: orderLabel,
        order_id: orderJson.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch(buildApiUrl("/payments/razorpay/verify"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              details: {
                name: details.name.trim(),
                address: details.address.trim(),
                pin: details.pin.trim(),
                mobile: details.mobile.trim(),
                landline: details.landline.trim(),
                email: details.email.trim(),
                website: details.website.trim(),
                institution: details.institution.trim(),
              },
              items: items.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category,
              })),
              source: "website",
              subtotal,
              shippingCharge,
              total: totalAmount,
              currency: "INR",
              planName: orderLabel,
            }),
          });
          const verifyJson = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || !verifyJson?.ok) {
            toast.error(verifyJson?.error || "Payment verification failed");
            return;
          }
          clearCart();
          toast.success("Payment successful!");
          navigate("/subscribe");
        },
        prefill: {
          name: details.name.trim(),
          email: details.email.trim(),
          contact: details.mobile.trim(),
        },
        theme: { color: "#f97316" },
      });

      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setIsPaying(false);
    }
  }

  if (!hasItems) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <Header />
        <main className="container py-16">
          <ScrollReveal direction="up" once>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">Checkout</h1>
            <p className="text-muted-foreground mb-6">
              Your cart is empty. Please add a subscription pack before proceeding to payment.
            </p>
            <Button
              type="button"
              className="rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
              onClick={() => navigate("/subscribe")}
            >
              Browse subscriptions
            </Button>
          </ScrollReveal>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        <section className="border-b border-border/60 py-10 md:py-14">
          <div className="container">
            <ScrollReveal direction="up" once>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">Checkout</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground font-sans">
                Share your details and confirm your Brainfeed subscription order. Payment gateway will open on the next step.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
            <div>
              <ScrollReveal direction="up" once>
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-7 space-y-3">
                  <h2 className="font-serif text-lg md:text-xl text-foreground mb-1">Your details</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Please fill in the required fields so our team can process your subscription and delivery.
                  </p>
                  <div className="space-y-3">
                    <Input
                      data-checkout-field="name"
                      placeholder="Name *"
                      required
                      className="h-9 text-sm"
                      value={details.name}
                      onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                    />
                    <Textarea
                      data-checkout-field="address"
                      placeholder="Address *"
                      required
                      className="min-h-[80px] text-sm resize-none"
                      value={details.address}
                      onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        data-checkout-field="pin"
                        placeholder="Pin *"
                        required
                        className="h-9 text-sm sm:w-1/3"
                        value={details.pin}
                        onChange={(e) => setDetails((d) => ({ ...d, pin: e.target.value }))}
                      />
                      <Input
                        data-checkout-field="mobile"
                        placeholder="Mobile No. *"
                        required
                        className="h-9 text-sm flex-1"
                        value={details.mobile}
                        onChange={(e) => setDetails((d) => ({ ...d, mobile: e.target.value }))}
                      />
                    </div>
                    <Input
                      data-checkout-field="landline"
                      placeholder="Land Line No. (optional)"
                      className="h-9 text-sm"
                      value={details.landline}
                      onChange={(e) => setDetails((d) => ({ ...d, landline: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="email"
                      placeholder="Email *"
                      type="email"
                      required
                      className="h-9 text-sm"
                      value={details.email}
                      onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="website"
                      placeholder="Website (optional)"
                      className="h-9 text-sm"
                      value={details.website}
                      onChange={(e) => setDetails((d) => ({ ...d, website: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="institution"
                      placeholder="Name of the Institution (optional)"
                      className="h-9 text-sm"
                      value={details.institution}
                      onChange={(e) => setDetails((d) => ({ ...d, institution: e.target.value }))}
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div>
              <ScrollReveal direction="up" once>
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-7 space-y-5">
                  <h2 className="font-serif text-lg md:text-xl text-foreground">Order summary</h2>
                  <div className="space-y-3 text-sm">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatRupees(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatRupees(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatRupees(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-medium text-foreground">
                      {shippingCharge > 0 ? formatRupees(shippingCharge) : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {formatRupees(totalAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Rs. 300 shipping is added only for Brainfeed Magazines when quantity is 1. Quantity 2 or more gets free shipping.
                  </p>
                  <Button
                    type="button"
                    className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                    onClick={handleCheckout}
                    disabled={isPaying}
                  >
                    {isPaying ? "Opening checkout..." : "Proceed to checkout"}
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;

