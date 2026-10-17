import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("onboarding.welcome")}</h1>
          <p className="text-gray-500">{t("onboarding.step1")}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/app/vehicles/new")}>{t("onboarding.step2")}</Button>
            <Button variant="outline" onClick={() => navigate("/app/dashboard")}>{t("onboarding.skip")}</Button>
          </div>
          <Button variant="ghost" onClick={() => navigate("/app/dashboard")}>{t("onboarding.finish")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
