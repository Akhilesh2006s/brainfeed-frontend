import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

export type User = {
  _id: string;
  name: string;
  email: string;
  howDidYouHear?: string;
  wantsUpdates?: boolean;
};

export type ProfileUpdateData = {
  name?: string;
  howDidYouHear?: string;
  wantsUpdates?: boolean;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (data: SignupData) => Promise<{ error?: string }>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error?: string }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmEmail: string;
  }) => Promise<{ error?: string; message?: string; pendingConfirmation?: boolean }>;
  confirmPasswordChange: (token: string) => Promise<{ error?: string; message?: string }>;
  logout: () => void;
};

export type SignupData = {
  name: string;
  email: string;
  password: string;
  howDidYouHear?: string;
  wantsUpdates?: boolean;
};

const STORAGE_KEY = "brainfeed_auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    try {
      const { token: t } = JSON.parse(stored);
      if (!t) {
        setIsLoading(false);
        return;
      }
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((u) => {
          if (u) {
            setUser(u);
            setToken(t);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => localStorage.removeItem(STORAGE_KEY))
        .finally(() => setIsLoading(false));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      const { user: u, token: t } = data;
      setUser(u);
      setToken(t);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Sign up failed" };
      const { user: u, token: t } = json;
      setUser(u);
      setToken(t);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!token) return { error: "Not logged in" };
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Failed to update profile" };
      setUser(json);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: json }));
      }
      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmEmail: string;
  }) => {
    if (!token) return { error: "Not logged in" };
    try {
      const res = await fetch(`${API_BASE}/api/auth/password-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: json.error || "Failed to change password" };
      return {
        message: json.message || "Password change submitted.",
        pendingConfirmation: Boolean(json.pendingConfirmation),
      };
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const confirmPasswordChange = async (confirmToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/password-change/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: confirmToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: json.error || "Failed to confirm password change" };
      return { message: json.message || "Password updated." };
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, signup, updateProfile, changePassword, confirmPasswordChange, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
