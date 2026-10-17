import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/brand/Logo";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { apiPatch } from "../lib/api";
import { Moon, Sun, Globe } from "lucide-react";
import { LayoutDashboard, Car, Wrench, Fuel, Receipt, Bell, FileText, BarChart3, Settings as SettingsIcon, LogOut, Menu, X, Users, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/Button";

const navItems = [
  { to: "/app/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/app/vehicles", icon: Car, key: "garage" },
  { to: "/app/maintenance", icon: Wrench, key: "maintenance" },
  { to: "/app/energy", icon: Fuel, key: "energy" },
  { to: "/app/expenses", icon: Receipt, key: "expenses" },
  { to: "/app/reminders", icon: Bell, key: "reminders" },
  { to: "/app/documents", icon: FileText, key: "documents" },
  { to: "/app/friends", icon: Users, key: "friends" },
  { to: "/app/messages", icon: MessageCircle, key: "messages" },
  { to: "/app/reports", icon: BarChart3, key: "reports" },
  { to: "/app/inspections", icon: Wrench, key: "inspections" },
  { to: "/app/finance", icon: Receipt, key: "finance" },
  { to: "/app/settings", icon: SettingsIcon, key: "settings" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
          <Logo variant="full" className="h-7" />
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`
              }
            >
              <item.icon className="h-4 w-4" />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex gap-2 px-3">
            <button onClick={async () => {
              const next = document.documentElement.classList.contains("dark") ? "LIGHT" : "DARK";
              document.documentElement.classList.toggle("dark");
              await apiPatch("/profile", { theme: next }).catch(() => {});
            }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <Sun className="h-3 w-3" />/<Moon className="h-3 w-3" />
            </button>
            <button onClick={async () => {
              const cur = i18n.language;
              const next = cur === "es" ? "en" : "es";
              i18n.changeLanguage(next);
              await apiPatch("/profile", { locale: next }).catch(() => {});
            }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <Globe className="h-3 w-3" /> {i18n.language.toUpperCase()}
            </button>
          </div>
          <div className="px-3 py-2 text-sm text-gray-500 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4" /> {t("auth.logout")}
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden">
          <button onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="ml-3"><Logo variant="icon" className="h-6 w-6" /></span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
