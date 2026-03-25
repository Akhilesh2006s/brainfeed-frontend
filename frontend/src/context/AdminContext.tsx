import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { buildApiUrl } from "@/lib/apiUrl";

const STORAGE_KEY = "brainfeed_admin";

type AdminUser = {
  id: string;
  name?: string;
  email: string;
  role?: "admin" | "editor";
};

type AdminContextValue = {
  token: string | null;
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAdmin: boolean;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { token?: string; admin?: any };
      const t = parsed.token;
      if (!t) {
        setIsLoading(false);
        return;
      }
      fetch(buildApiUrl("/admin/me"), {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) {
            localStorage.removeItem(STORAGE_KEY);
            return;
          }
          const current: AdminUser = {
            id: data.id || data._id,
            name: data.name,
            email: data.email,
            role: data.role,
          };
          setToken(t);
          setAdmin(current);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, admin: data }));
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(buildApiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      const { token: t, admin: adminData } = data;
      const current: AdminUser = {
        id: adminData?.id || adminData?._id,
        name: adminData?.name,
        email: adminData?.email,
        role: adminData?.role,
      };
      setToken(t);
      setAdmin(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, admin: adminData }));
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      admin,
      isLoading,
      login,
      logout,
      // Only treat users with role === "admin" as full admins in the UI.
      // Editors can still log in and manage news posts, but won't see Users/Products sections.
      isAdmin: admin?.role === "admin",
    }),
    [token, admin, isLoading]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
