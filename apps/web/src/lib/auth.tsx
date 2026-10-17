import React, { createContext, useContext, useState, useEffect } from "react";
import { apiGet, apiPost } from "./api";
import i18n from "../i18n";

interface User {
  id: string; name: string; email: string; locale: string; currency: string;
  distanceUnit: string; volumeUnit: string; timeZone: string; theme: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await apiGet<{ data: User }>("/auth/me");
      setUser(res.data);
      if (res.data.locale) i18n.changeLanguage(res.data.locale);
      applyTheme(res.data.theme);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function login(email: string, password: string) {
    const res = await apiPost<{ data: User }>("/auth/login", { email, password });
    setUser(res.data);
    await refresh();
  }
  async function register(name: string, email: string, password: string) {
    await apiPost("/auth/register", { name, email, password });
    await login(email, password);
  }
  async function logout() {
    await apiPost("/auth/logout");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }

function applyTheme(theme: string) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "DARK" || (theme === "SYSTEM" && prefersDark);
  root.classList.toggle("dark", dark);
}
