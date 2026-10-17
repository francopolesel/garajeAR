import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { apiPost } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const { register, handleSubmit } = useForm();
  async function onSubmit(data: { email: string }) {
    await apiPost("/auth/forgot-password", data);
    setDone(true);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold mb-6">{t("auth.forgotPassword")}</h1>
          {done ? <p>Si el correo existe, enviamos un enlace.</p> : (
            <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
              <Input label={t("auth.email")} type="email" {...register("email")} />
              <Button type="submit" className="w-full">{t("common.submit")}</Button>
            </form>
          )}
          <div className="mt-4 text-sm text-center"><Link to="/login" className="text-brand-600 hover:underline">{t("common.back")}</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
