import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { Car, Wrench, Bell, Receipt, FileText } from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => apiGet<any>("/reports/dashboard") });
  const d = data?.data;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{t("dashboard.activeVehicles")}</p><p className="text-2xl font-bold">{d?.activeVehicles ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{t("dashboard.upcomingReminders")}</p><p className="text-2xl font-bold">{d?.upcomingReminders ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{t("dashboard.overdueReminders")}</p><p className="text-2xl font-bold text-red-600">{d?.overdueReminders ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">{t("dashboard.expiringDocs")}</p><p className="text-2xl font-bold">{d?.expiringDocuments ?? 0}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t("dashboard.quickActions")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/app/vehicles/new"><Button><Car className="h-4 w-4" />{t("dashboard.addVehicle")}</Button></Link>
          <Link to="/app/maintenance"><Button variant="secondary"><Wrench className="h-4 w-4" />{t("dashboard.addMaintenance")}</Button></Link>
          <Link to="/app/energy"><Button variant="secondary"><FileText className="h-4 w-4" />{t("dashboard.addFuel")}</Button></Link>
          <Link to="/app/expenses"><Button variant="secondary"><Receipt className="h-4 w-4" />{t("dashboard.addExpense")}</Button></Link>
          <Link to="/app/reminders"><Button variant="secondary"><Bell className="h-4 w-4" />{t("dashboard.addReminder")}</Button></Link>
          <Link to="/app/documents"><Button variant="secondary"><FileText className="h-4 w-4" />{t("dashboard.uploadDoc")}</Button></Link>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.recentActivity")}</CardTitle></CardHeader>
          <CardContent>
            {(d?.recentMaintenance || []).map((m: any) => (
              <div key={m.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-gray-500">{m.vehicle?.name} · {new Date(m.serviceDate).toLocaleDateString()}</p>
              </div>
            ))}
            {!d?.recentMaintenance?.length && <p className="text-sm text-gray-500">{t("commonExtra.noActivity")}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.monthExpenses")}</CardTitle></CardHeader>
          <CardContent>
            {(d?.monthExpensesByCurrency || []).map((m: any) => (
              <div key={m.currency} className="flex justify-between py-1">
                <span>{m.currency}</span>
                <span className="font-semibold">{Number(m.total).toFixed(2)}</span>
              </div>
            ))}
            {!d?.monthExpensesByCurrency?.length && <p className="text-sm text-gray-500">{t("commonExtra.noExpensesMonth")}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
