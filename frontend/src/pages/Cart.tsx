import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

const formatRupees = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const navigate = useNavigate();

  const hasItems = items.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main>
        <section className="border-b border-border/60 py-10 md:py-14">
          <div className="container">
            <ScrollReveal direction="up" once>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">Cart</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground font-sans">
                Review your selected Brainfeed packs and magazine subscriptions before proceeding.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
            <div>
              <ScrollReveal direction="up" once>
                {!hasItems ? (
                  <div className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-8 text-center">
                    <p className="font-sans text-muted-foreground mb-4">
                      Your cart is empty. Browse our subscription packs to get started.
                    </p>
                    <Button asChild className="rounded-full text-xs font-semibold uppercase tracking-[0.18em]">
                      <a href="/subscribe">Browse subscriptions</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 p-4 md:p-5"
                      >
                        <div>
                          <h2 className="font-serif text-base md:text-lg text-foreground">{item.name}</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatRupees(item.price)} per subscription
                          </p>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="h-8 w-8 flex items-center justify-center rounded-full border border-border/80 text-sm font-semibold text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              −
                            </button>
                            <span className="min-w-[2.5rem] text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center rounded-full border border-border/80 text-sm font-semibold text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {formatRupees(item.price * item.quantity)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="mt-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                        onClick={clearCart}
                      >
                        Clear cart
                      </Button>
                    </div>
                  </div>
                )}
              </ScrollReveal>
            </div>

            <div>
              <ScrollReveal direction="up" once>
                <div className="rounded-xl border border-border/60 bg-card/60 p-6 md:p-7 space-y-4">
                  <h2 className="font-serif text-lg md:text-xl text-foreground">Order summary</h2>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatRupees(subtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    After reviewing your cart, continue to checkout to fill in your details and complete payment.
                  </p>
                  <Button
                    type="button"
                    disabled={!hasItems}
                    className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to checkout
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

export default Cart;

