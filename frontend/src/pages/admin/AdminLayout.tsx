import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { useEffect } from "react";
import { Newspaper, PlusCircle, LogOut, List, Plus, Users as UsersIcon, Package, Settings, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const { token, admin, isLoading, logout, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;

  const isNewsPostsActive = pathname === "/admin/posts" || pathname.startsWith("/admin/posts/");
  const isAddNewsActive = pathname === "/admin/posts/new";
  const isPagesActive = pathname.startsWith("/admin/pages");
  const isFlipbooksActive = pathname.startsWith("/admin/flipbooks");
  const isSiteSettingsActive = pathname.startsWith("/admin/site-settings");
  const isSubscriptionsActive = pathname.startsWith("/admin/subscriptions");
  const isProductsActive = pathname.startsWith("/admin/products");
  const isUsersActive = pathname.startsWith("/admin/users");
  const isSignupUsersActive = pathname.startsWith("/admin/signup-users");

  const baseNavClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors";

  const inactiveClasses =
    "text-muted-foreground hover:bg-accent/10 hover:text-accent";

  const activeClasses = "bg-accent/10 text-accent";

  useEffect(() => {
    if (!isLoading && !token) {
      navigate("/admin/login", { replace: true });
    }
  }, [token, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border/60 bg-card/60 flex flex-col">
        <div className="p-4 border-b border-border/60">
          <h1 className="font-serif text-lg font-semibold text-foreground">Brainfeed Admin</h1>
          {admin && (
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              Signed in as {admin.email} ({admin.role || "admin"})
            </p>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/admin/posts?type=news"
            className={`${baseNavClasses} ${isNewsPostsActive && !isAddNewsActive ? activeClasses : inactiveClasses}`}
          >
            <Newspaper className="h-4 w-4" />
            News posts
          </Link>
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-border/60">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Pages</p>
              <Link
                to="/admin/pages"
                className={`${baseNavClasses} ${isPagesActive ? activeClasses : inactiveClasses}`}
              >
                <List className="h-4 w-4" />
                All Pages
              </Link>
              <Link
                to="/admin/pages/new"
                className={`${baseNavClasses} ${isPagesActive ? activeClasses : inactiveClasses}`}
              >
                <Plus className="h-4 w-4" />
                Add Page
              </Link>
              <Link
                to="/admin/flipbooks"
                className={`${baseNavClasses} mt-1 ${isFlipbooksActive ? activeClasses : inactiveClasses}`}
              >
                <BookOpen className="h-4 w-4" />
                Flipbooks (PDF)
              </Link>
              <Link
                to="/admin/flipbooks/new"
                className={`${baseNavClasses} ${isFlipbooksActive ? activeClasses : inactiveClasses}`}
              >
                <Plus className="h-4 w-4" />
                Add flipbook
              </Link>
              <Link
                to="/admin/site-settings"
                className={`${baseNavClasses} mt-1 ${isSiteSettingsActive ? activeClasses : inactiveClasses}`}
              >
                <Settings className="h-4 w-4" />
                Site settings
              </Link>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-border/60">
            <Link
              to="/admin/posts/new?type=news"
              className={`${baseNavClasses} ${isAddNewsActive ? activeClasses : inactiveClasses}`}
            >
              <PlusCircle className="h-4 w-4" />
              Add news
            </Link>
          </div>
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-border/60">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Subscriptions
              </p>
              <Link
                to="/admin/subscriptions"
                className={`${baseNavClasses} ${isSubscriptionsActive ? activeClasses : inactiveClasses}`}
              >
                <Package className="h-4 w-4" />
                Our subscriptions
              </Link>
              <Link
                to="/admin/products"
                className={`${baseNavClasses} mt-1 ${isProductsActive ? activeClasses : inactiveClasses}`}
              >
                <Package className="h-4 w-4" />
                Products
              </Link>
            </div>
          )}
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-border/60">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Users</p>
              <Link
                to="/admin/users"
                className={`${baseNavClasses} ${isUsersActive ? activeClasses : inactiveClasses}`}
              >
                <UsersIcon className="h-4 w-4" />
                Manage users
              </Link>
            </div>
          )}
        </nav>
        <div className="p-3 border-t border-border/60">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground block mb-2">
            ← Back to site
          </Link>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { logout(); navigate("/admin/login", { replace: true }); }}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
