import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../lib/auth";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { Logo } from "../components/brand/Logo";
import i18n from "../i18n";
import { Moon, Sun, Globe } from "lucide-react";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const errorParam = params.get("error");
  useEffect(() => {
    fetch("/api/v1/auth/google/enabled").then((r) => r.json()).then((j) => setGoogleEnabled(!!j?.data?.enabled)).catch(() => setGoogleEnabled(false));
  }, []);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data: { email: string; password: string }) {
    try {
      await login(data.email, data.password);
      navigate("/app/dashboard");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => {
          const next = document.documentElement.classList.contains("dark") ? "LIGHT" : "DARK";
          document.documentElement.classList.toggle("dark");
          localStorage.setItem("theme", next);
        }} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {document.documentElement.classList.contains("dark") ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={() => {
          const next = i18n.language === "es" ? "en" : "es";
          i18n.changeLanguage(next);
          localStorage.setItem("locale", next);
        }} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium">
          {i18n.language.toUpperCase()}
        </button>
      </div>
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center"><Logo variant="full" className="h-10" /></div>
          <h1 className="text-2xl font-bold mb-6">{t("auth.login")}</h1>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <Input label={t("auth.email")} type="email" {...register("email")} error={errors.email?.message as string} />
            <Input label={t("auth.password")} type="password" {...register("password")} error={errors.password?.message as string} />
            <Button type="submit" className="w-full" loading={isSubmitting}>{t("auth.login")}</Button>
          </form>
          {errorParam && <p className="mt-3 text-sm text-red-600">Error de Google: {errorParam}</p>}
          {googleEnabled && (
            <div className="mt-4">
              <a href="/api/v1/auth/google"><Button variant="outline" className="w-full">Continuar con Google</Button></a>
            </div>
          )}
          <div className="mt-4 text-sm text-center space-y-2">
            <Link to="/forgot-password" className="text-brand-600 hover:underline">{t("auth.forgotPassword")}</Link>
            <div>{t("auth.noAccount")} <Link to="/register" className="text-brand-600 hover:underline">{t("auth.register")}</Link></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
