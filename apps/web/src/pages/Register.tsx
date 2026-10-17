import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../lib/auth";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { Logo } from "../components/brand/Logo";

const schema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) });

export default function Register() {
  const { t } = useTranslation();
  const { register: reg } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data: { name: string; email: string; password: string }) {
    try {
      await reg(data.name, data.email, data.password);
      navigate("/onboarding");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center"><Logo variant="full" className="h-10" /></div>
          <h1 className="text-2xl font-bold mb-6">{t("auth.register")}</h1>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <Input label={t("auth.name")} {...register("name")} error={errors.name?.message as string} />
            <Input label={t("auth.email")} type="email" {...register("email")} error={errors.email?.message as string} />
            <Input label={t("auth.password")} type="password" {...register("password")} error={errors.password?.message as string} />
            <Button type="submit" className="w-full" loading={isSubmitting}>{t("auth.register")}</Button>
          </form>
          <div className="mt-4 text-sm text-center">
            {t("auth.hasAccount")} <Link to="/login" className="text-brand-600 hover:underline">{t("auth.login")}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
