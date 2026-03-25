import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Subscribe from "./pages/Subscribe";
import Contact from "./pages/Contact";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import MagazineDetail from "./pages/MagazineDetail";
import ProductDetail from "./pages/ProductDetail";
import { AdminProvider } from "@/context/AdminContext";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminPostList from "./pages/admin/AdminPostList";
import AdminPostForm from "./pages/admin/AdminPostForm";
import AdminPageList from "./pages/admin/AdminPageList";
import AdminPageForm from "./pages/admin/AdminPageForm";
import AdminUserList from "./pages/admin/AdminUserList";
import AdminSignupUserList from "./pages/admin/AdminSignupUserList";
import AdminSubscriptionList from "./pages/admin/AdminSubscriptionList";
import AdminProductList from "./pages/admin/AdminProductList";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import PageView from "./pages/PageView";
import AdminFlipbookList from "./pages/admin/AdminFlipbookList";
import AdminFlipbookForm from "./pages/admin/AdminFlipbookForm";
import NotFound from "./pages/NotFound";
import { useEffect, useRef, lazy, Suspense } from "react";

const FlipbookView = lazy(() => import("./pages/FlipbookView"));
import { buildCanonicalUrl, removeTrackingParams } from "@/lib/seo";
import FloatingSubscribe from "@/components/FloatingSubscribe";

const queryClient = new QueryClient();

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  const lastKeyRef = useRef<string>(location.key);
  const lastScrollYRef = useRef<number>(0);

  // Disable browser native scroll restoration so it won't fight our logic.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("scrollRestoration" in window.history)) return;

    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  // Track latest scroll position while on the current route.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      lastScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Save the scroll for the route we are leaving, then restore for the route we are entering.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentKey = location.key;

    // Save leaving page scroll
    try {
      sessionStorage.setItem(`bf-scroll:${lastKeyRef.current}`, String(lastScrollYRef.current));
    } catch {
      // ignore storage errors (private mode, etc.)
    }

    // Restore entering page scroll
    let savedTop: number | null = null;
    try {
      const raw = sessionStorage.getItem(`bf-scroll:${currentKey}`);
      if (raw !== null) savedTop = Number(raw);
    } catch {
      savedTop = null;
    }

    // If this is not a back/forward navigation, default to top.
    const shouldRestore = navigationType === "POP" && typeof savedTop === "number" && !Number.isNaN(savedTop);
    const top = shouldRestore ? savedTop! : 0;

    // Wait a tick for mobile layouts to settle.
    requestAnimationFrame(() => setTimeout(() => window.scrollTo({ top, behavior: "auto" }), 0));

    lastKeyRef.current = currentKey;
  }, [location.key, navigationType]);

  // Remove tracking params (ref/source/utm/etc.) from indexable URLs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!location.search) return;

    const params = new URLSearchParams(location.search);
    const cleaned = removeTrackingParams(params);
    if (cleaned.toString() === params.toString()) return;

    const query = cleaned.toString();
    const nextUrl = `${location.pathname}${query ? `?${query}` : ""}${location.hash || ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [location.pathname, location.search, location.hash]);

  // Keep canonical URL in sync to prevent duplicate-content indexing.
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const canonicalHref = buildCanonicalUrl(location.pathname, params);

    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.setAttribute("rel", "canonical");
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute("href", canonicalHref);
  }, [location.pathname, location.search]);

  // Inject Organization schema site-wide for rich results.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const schemaId = "bf-org-schema";
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Brainfeed Magazine",
      url: "https://brainfeedmagazine.com",
      logo: "https://brainfeedmagazine.com/logo.png",
      sameAs: [
        "https://www.facebook.com/brainfeededumg",
        "https://www.instagram.com/brainfeededumag",
        "https://in.linkedin.com/company/brainfeed-magazine",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi", "Telugu"],
          email: "info@brainfeedmagazine.com",
          telephone: "+91-7207015151",
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          areaServed: "IN",
          availableLanguage: ["English"],
          email: "sales@brainfeedmagazine.com",
        },
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    };

    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = schemaId;
      document.head.appendChild(scriptEl);
    }
    scriptEl.text = JSON.stringify(schema);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const schemaId = "bf-website-schema";
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Brainfeed Magazine",
      url: "https://brainfeedmagazine.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://brainfeedmagazine.com/news?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    };

    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = schemaId;
      document.head.appendChild(scriptEl);
    }
    scriptEl.text = JSON.stringify(schema);
  }, []);

  return null;
}

function FloatingSubscribeOnPublic() {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return <FloatingSubscribe />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <AuthProvider>
          <AdminProvider>
            <SiteSettingsProvider>
              <BrowserRouter>
                <ScrollManager />
                <FloatingSubscribeOnPublic />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Navigate to="/news" replace />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug/:id" element={<NewsArticle />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/magazine/:id" element={<MagazineDetail />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/signup" element={<Navigate to="/" replace />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Navigate to="/admin/posts" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/posts" element={<AdminLayout />}>
                  <Route index element={<AdminPostList />} />
                  <Route path="new" element={<AdminPostForm />} />
                  <Route path=":id/edit" element={<AdminPostForm />} />
                </Route>
                <Route path="/admin/subscriptions" element={<AdminLayout />}>
                  <Route index element={<AdminSubscriptionList />} />
                </Route>
                <Route path="/admin/products" element={<AdminLayout />}>
                  <Route index element={<AdminProductList />} />
                  <Route path="new" element={<AdminProductForm />} />
                  <Route path=":id/edit" element={<AdminProductForm />} />
                </Route>
                <Route path="/admin/users" element={<AdminLayout />}>
                  <Route index element={<AdminUserList />} />
                </Route>
                <Route path="/admin/signup-users" element={<AdminLayout />}>
                  <Route index element={<AdminSignupUserList />} />
                </Route>
                <Route path="/admin/pages" element={<AdminLayout />}>
                  <Route index element={<AdminPageList />} />
                  <Route path="new" element={<AdminPageForm />} />
                  <Route path=":id/edit" element={<AdminPageForm />} />
                </Route>
                <Route path="/admin/flipbooks" element={<AdminLayout />}>
                  <Route index element={<AdminFlipbookList />} />
                  <Route path="new" element={<AdminFlipbookForm />} />
                  <Route path=":id/edit" element={<AdminFlipbookForm />} />
                </Route>
                <Route path="/admin/site-settings" element={<AdminLayout />}>
                  <Route index element={<AdminSiteSettings />} />
                </Route>
                <Route path="/page/:slug" element={<PageView />} />
                <Route path="/:slug" element={<PageView />} />
                <Route
                  path="/flipbook/:slug"
                  element={
                    <Suspense
                      fallback={
                        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                          Loading flipbook…
                        </div>
                      }
                    >
                      <FlipbookView />
                    </Suspense>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SiteSettingsProvider>
          </AdminProvider>
        </AuthProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
