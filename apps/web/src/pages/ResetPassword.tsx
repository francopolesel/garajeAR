import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { apiPost } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const schema = z.object({ password: z.string().min(8) });

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  async function onSubmit(data: { password: string }) {
    await apiPost("/auth/reset-password", { token, password: data.password });
    navigate("/login");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold mb-6">{t("auth.resetPassword")}</h1>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <Input label={t("auth.password")} type="password" {...register("password")} />
            <Button type="submit" className="w-full" loading={isSubmitting}>{t("auth.resetPassword")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
