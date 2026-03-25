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
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const hasItems = items.length > 0;
  const [isPaying, setIsPaying] = useState(false);
  const orderLabel = useMemo(() => (items.length === 1 ? items[0].name : `Brainfeed order (${items.length} items)`), [items]);

  async function handleCheckout() {
    try {
      setIsPaying(true);

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      const amountPaise = Math.round(subtotal * 100);

      const orderRes = await fetch(buildApiUrl("/payments/razorpay/order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `bf_${Date.now()}`,
          notes: {
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
            body: JSON.stringify(response),
          });
          const verifyJson = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || !verifyJson?.ok) {
            toast.error(verifyJson?.error || "Payment verification failed");
            return;
          }
          toast.success("Payment successful!");
          navigate("/subscribe");
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
                    Please fill in all fields so our team can process your subscription and delivery.
                  </p>
                  <div className="space-y-3">
                    <Input placeholder="Name *" required className="h-9 text-sm" />
                    <Textarea
                      placeholder="Address *"
                      required
                      className="min-h-[80px] text-sm resize-none"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input placeholder="Pin *" required className="h-9 text-sm sm:w-1/3" />
                      <Input placeholder="Mobile No. *" required className="h-9 text-sm flex-1" />
                    </div>
                    <Input placeholder="Land Line No. *" required className="h-9 text-sm" />
                    <Input placeholder="Email *" type="email" required className="h-9 text-sm" />
                    <Input placeholder="Website *" required className="h-9 text-sm" />
                    <Input placeholder="Name of the Institution *" required className="h-9 text-sm" />
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
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {formatRupees(subtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By continuing, you agree that Brainfeed will contact you with payment instructions and shipping details.
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

