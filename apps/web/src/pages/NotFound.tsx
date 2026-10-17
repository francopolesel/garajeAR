import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <h1 className="text-6xl font-bold text-brand-600">404</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">{t("errors.notFound")}</p>
      <Link to="/" className="mt-6"><Button>{t("common.back")}</Button></Link>
    </div>
  );
}
