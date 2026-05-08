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
import { CheckCircle2, XCircle } from "lucide-react";
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
  const magazineQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (isMagazineItem(item) ? item.quantity : 0), 0),
    [items],
  );
  const shippingCharge = useMemo(
    () => magazineQuantity * 300,
    [magazineQuantity],
  );
  const totalAmount = subtotal + shippingCharge;
  const [paymentResult, setPaymentResult] = useState<{
    status: "success" | "failed";
    title: string;
    description: string;
  } | null>(null);

  const [billingDetails, setBillingDetails] = useState({
    contactName: "",
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    contact: "",
  });
  const [shippingDetails, setShippingDetails] = useState({
    contactName: "",
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    contact: "",
  });

  function validateDetails() {
    const requiredBilling: Array<{ key: keyof typeof billingDetails; label: string }> = [
      { key: "contactName", label: "Billing name" },
      { key: "fullAddress", label: "Billing full address" },
      { key: "city", label: "Billing city" },
      { key: "state", label: "Billing state" },
      { key: "pincode", label: "Billing pincode" },
      { key: "email", label: "Billing email" },
      { key: "contact", label: "Billing contact" },
    ];
    const requiredShipping: Array<{ key: keyof typeof shippingDetails; label: string }> = [
      { key: "contactName", label: "Shipping name" },
      { key: "fullAddress", label: "Shipping full address" },
      { key: "city", label: "Shipping city" },
      { key: "state", label: "Shipping state" },
      { key: "pincode", label: "Shipping pincode" },
      { key: "email", label: "Shipping email" },
      { key: "contact", label: "Shipping contact" },
    ];

    for (const f of requiredBilling) {
      const value = String(billingDetails[f.key] || "").trim();
      if (!value) {
        toast.error(`Please enter ${f.label}.`);
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[data-checkout-field="billing-${String(f.key)}"]`,
        );
        el?.focus();
        return false;
      }
    }

    for (const f of requiredShipping) {
      const value = String(shippingDetails[f.key] || "").trim();
      if (!value) {
        toast.error(`Please enter ${f.label}.`);
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[data-checkout-field="shipping-${String(f.key)}"]`,
        );
        el?.focus();
        return false;
      }
    }

    const billingEmail = billingDetails.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      toast.error("Please enter a valid billing email.");
      document.querySelector<HTMLInputElement>(`[data-checkout-field="billing-email"]`)?.focus();
      return false;
    }
    const shippingEmail = shippingDetails.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingEmail)) {
      toast.error("Please enter a valid shipping email.");
      document.querySelector<HTMLInputElement>(`[data-checkout-field="shipping-email"]`)?.focus();
      return false;
    }

    return true;
  }

  async function handleCheckout() {
    try {
      if (!validateDetails()) return;
      setIsPaying(true);
      setPaymentResult(null);

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
            customerName: billingDetails.contactName.trim(),
            customerEmail: billingDetails.email.trim(),
            customerMobile: billingDetails.contact.trim(),
            address: shippingDetails.fullAddress.trim(),
            pin: shippingDetails.pincode.trim(),
            city: shippingDetails.city.trim(),
            state: shippingDetails.state.trim(),
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
              billingDetails: {
                contactName: billingDetails.contactName.trim(),
                fullAddress: billingDetails.fullAddress.trim(),
                city: billingDetails.city.trim(),
                state: billingDetails.state.trim(),
                pincode: billingDetails.pincode.trim(),
                email: billingDetails.email.trim(),
                contact: billingDetails.contact.trim(),
              },
              shippingDetails: {
                contactName: shippingDetails.contactName.trim(),
                fullAddress: shippingDetails.fullAddress.trim(),
                city: shippingDetails.city.trim(),
                state: shippingDetails.state.trim(),
                pincode: shippingDetails.pincode.trim(),
                email: shippingDetails.email.trim(),
                contact: shippingDetails.contact.trim(),
              },
              details: {
                name: shippingDetails.contactName.trim(),
                address: shippingDetails.fullAddress.trim(),
                pin: shippingDetails.pincode.trim(),
                mobile: shippingDetails.contact.trim(),
                email: shippingDetails.email.trim(),
              },
              items: items.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category,
                imageUrl: item.imageUrl,
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
            setPaymentResult({
              status: "failed",
              title: "Payment failed",
              description: verifyJson?.error || "Payment verification failed. Please try again.",
            });
            toast.error(verifyJson?.error || "Payment verification failed");
            return;
          }
          clearCart();
          setPaymentResult({
            status: "success",
            title: "Successfully paid",
            description: "Order confirmed. Our team will process your subscription shortly.",
          });
          toast.success("Payment successful!");
        },
        prefill: {
          name: billingDetails.contactName.trim(),
          email: billingDetails.email.trim(),
          contact: billingDetails.contact.trim(),
        },
        modal: {
          ondismiss: () => {
            setPaymentResult((current) =>
              current ?? {
                status: "failed",
                title: "Payment failed",
                description: "Payment was cancelled or not completed.",
              },
            );
          },
        },
        theme: { color: "#f97316" },
      }) as {
        open: () => void;
        on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
      };

      rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
        const description = response?.error?.description || "Payment failed. Please try again.";
        setPaymentResult({
          status: "failed",
          title: "Payment failed",
          description,
        });
        toast.error(description);
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

        {paymentResult && (
          <section className="pt-8">
            <div className="container">
              <div
                className={`rounded-2xl border p-5 md:p-6 ${
                  paymentResult.status === "success"
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-rose-200 bg-rose-50/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  {paymentResult.status === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h2 className="font-serif text-xl text-foreground">{paymentResult.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{paymentResult.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {paymentResult.status === "success" ? (
                        <Button
                          type="button"
                          className="rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                          onClick={() => navigate("/subscribe")}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                          onClick={() => setPaymentResult(null)}
                        >
                          Try again
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-10 md:py-14">
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
            <div>
              <ScrollReveal direction="up" once>
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-7 space-y-3">
                  <h2 className="font-serif text-lg md:text-xl text-foreground mb-1">Billing details</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    All billing fields are required.
                  </p>
                  <div className="space-y-3">
                    <Input
                      data-checkout-field="billing-contactName"
                      placeholder="Billing Name *"
                      required
                      className="h-9 text-sm"
                      value={billingDetails.contactName}
                      onChange={(e) => setBillingDetails((d) => ({ ...d, contactName: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="billing-email"
                      placeholder="Billing Email *"
                      type="email"
                      required
                      className="h-9 text-sm"
                      value={billingDetails.email}
                      onChange={(e) => setBillingDetails((d) => ({ ...d, email: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="billing-contact"
                      placeholder="Billing Contact *"
                      required
                      className="h-9 text-sm"
                      value={billingDetails.contact}
                      onChange={(e) => setBillingDetails((d) => ({ ...d, contact: e.target.value }))}
                    />
                    <Textarea
                      data-checkout-field="billing-fullAddress"
                      placeholder="Billing Full Address *"
                      required
                      className="min-h-[80px] text-sm resize-none"
                      value={billingDetails.fullAddress}
                      onChange={(e) => setBillingDetails((d) => ({ ...d, fullAddress: e.target.value }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        data-checkout-field="billing-city"
                        placeholder="Billing City *"
                        required
                        className="h-9 text-sm"
                        value={billingDetails.city}
                        onChange={(e) => setBillingDetails((d) => ({ ...d, city: e.target.value }))}
                      />
                      <Input
                        data-checkout-field="billing-state"
                        placeholder="Billing State *"
                        required
                        className="h-9 text-sm"
                        value={billingDetails.state}
                        onChange={(e) => setBillingDetails((d) => ({ ...d, state: e.target.value }))}
                      />
                      <Input
                        data-checkout-field="billing-pincode"
                        placeholder="Billing Pincode *"
                        required
                        className="h-9 text-sm"
                        value={billingDetails.pincode}
                        onChange={(e) => setBillingDetails((d) => ({ ...d, pincode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <h2 className="font-serif text-lg md:text-xl text-foreground mb-1 pt-2">Shipping details</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Shipping email, contact, full address, city, state and pincode are mandatory.
                  </p>
                  <div className="space-y-3">
                    <Input
                      data-checkout-field="shipping-contactName"
                      placeholder="Shipping Name *"
                      required
                      className="h-9 text-sm"
                      value={shippingDetails.contactName}
                      onChange={(e) => setShippingDetails((d) => ({ ...d, contactName: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="shipping-email"
                      placeholder="Shipping Email *"
                      type="email"
                      required
                      className="h-9 text-sm"
                      value={shippingDetails.email}
                      onChange={(e) => setShippingDetails((d) => ({ ...d, email: e.target.value }))}
                    />
                    <Input
                      data-checkout-field="shipping-contact"
                      placeholder="Shipping Contact *"
                      required
                      className="h-9 text-sm"
                      value={shippingDetails.contact}
                      onChange={(e) => setShippingDetails((d) => ({ ...d, contact: e.target.value }))}
                    />
                    <Textarea
                      data-checkout-field="shipping-fullAddress"
                      placeholder="Shipping Full Address *"
                      required
                      className="min-h-[80px] text-sm resize-none"
                      value={shippingDetails.fullAddress}
                      onChange={(e) => setShippingDetails((d) => ({ ...d, fullAddress: e.target.value }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        data-checkout-field="shipping-city"
                        placeholder="Shipping City *"
                        required
                        className="h-9 text-sm"
                        value={shippingDetails.city}
                        onChange={(e) => setShippingDetails((d) => ({ ...d, city: e.target.value }))}
                      />
                      <Input
                        data-checkout-field="shipping-state"
                        placeholder="Shipping State *"
                        required
                        className="h-9 text-sm"
                        value={shippingDetails.state}
                        onChange={(e) => setShippingDetails((d) => ({ ...d, state: e.target.value }))}
                      />
                      <Input
                        data-checkout-field="shipping-pincode"
                        placeholder="Shipping Pincode *"
                        required
                        className="h-9 text-sm"
                        value={shippingDetails.pincode}
                        onChange={(e) => setShippingDetails((d) => ({ ...d, pincode: e.target.value }))}
                      />
                    </div>
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
                    Shipping is charged only for Brainfeed Magazines at Rs. 300 per quantity.
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

