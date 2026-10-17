import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-600">GarajeAR</span>
          <div className="flex gap-3">
            <Link to="/login"><Button variant="ghost">{t("auth.login")}</Button></Link>
            <Link to="/register"><Button>{t("auth.register")}</Button></Link>
          </div>
        </div>
      </nav>
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">{t("landing.heroTitle")}</h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t("landing.heroSubtitle")}</p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/register"><Button size="lg">{t("landing.ctaStart")}</Button></Link>
          <Link to="/login"><Button variant="outline" size="lg">{t("landing.ctaLogin")}</Button></Link>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        {["vehicles", "maintenance", "expenses"].map((k) => (
          <div key={k} className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl">
            <h3 className="font-semibold text-lg capitalize">{k}</h3>
            <p className="text-sm text-gray-500 mt-2">Gestioná {k} fácilmente.</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} GarajeAR
      </footer>
    </div>
  );
}
