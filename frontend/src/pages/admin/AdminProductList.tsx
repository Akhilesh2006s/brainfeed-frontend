import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Package, Pencil, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

type Product = {
  _id: string;
  category: "pre-primary" | "library" | "classroom" | "magazine";
  name: string;
  slug: string;
  description?: string;
  badge?: string;
  tag?: string;
  price: number;
  oldPrice?: number;
  currency?: string;
  imageUrl?: string;
  active?: boolean;
  order?: number;
  createdAt?: string;
};

const CATEGORY_LABELS: Record<Product["category"], string> = {
  "pre-primary": "Pre Primary Packs",
  library: "Library Packs",
  classroom: "Classroom Packs",
  magazine: "Magazines",
};

const AdminProductList = () => {
  const { token, isAdmin } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error("Failed to load products.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete product.");
        return;
      }
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-foreground">Subscription products</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          You are logged in as an <span className="font-semibold">Editor</span>. Only Admin users can manage
          subscription products. Please ask an Admin to update packs and magazine prices/images.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Subscription products</h1>
            <p className="text-xs text-muted-foreground">
              Control what appears on the Subscribe page – packs, magazines, prices and images.
            </p>
          </div>
        </div>
        <Link to="/admin/products/new">
          <Button className="inline-flex items-center gap-1.5 text-xs">
            <PlusCircle className="h-4 w-4" />
            Add product
          </Button>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/70">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No products found yet. Add your first pack or magazine using the button above.
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Name</th>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Category</th>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Price</th>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Badge</th>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-left font-medium">Active</th>
                  <th className="sticky top-0 z-10 border-b border-border/60 bg-muted p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-muted/30"
                  >
                    <td className="border-b border-border/40 p-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.description && (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="border-b border-border/40 p-3 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[p.category]}
                    </td>
                    <td className="border-b border-border/40 p-3 text-sm text-foreground">
                      {p.oldPrice ? (
                        <span className="flex flex-col">
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{p.oldPrice.toLocaleString("en-IN")}
                          </span>
                          <span>₹{p.price.toLocaleString("en-IN")}</span>
                        </span>
                      ) : (
                        <>₹{p.price.toLocaleString("en-IN")}</>
                      )}
                    </td>
                    <td className="border-b border-border/40 p-3 text-xs text-muted-foreground">
                      {p.badge || "—"}
                    </td>
                    <td className="border-b border-border/40 p-3 text-xs">
                      {p.active ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border/40 p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/${p._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductList;

