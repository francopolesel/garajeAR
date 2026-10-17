import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const { t } = useTranslation();
  const { data: trendData } = useQuery({ queryKey: ["spending-trend"], queryFn: () => apiGet<any>("/reports/spending-trend") });
  const { data: maintData } = useQuery({ queryKey: ["maintenance-status"], queryFn: () => apiGet<any>("/reports/maintenance-status") });
  const expenses = trendData?.data || [];

  // aggregate by month
  const byMonth: Record<string, number> = {};
  for (const e of expenses) {
    const d = new Date(e.expenseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] || 0) + Number(e.amount);
  }
  const chartData = Object.entries(byMonth).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month));

  // by category
  const byCat: Record<string, number> = {};
  for (const e of expenses) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  const colors = ["#15803d", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#65a30d"];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>{t("reports.spendingOverTime")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#15803d" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-500">{t("reports.insufficientData")}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("reports.byCategory")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-500">{t("reports.insufficientData")}</p>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t("reports.maintenanceCosts")}</CardTitle></CardHeader>
        <CardContent>
          {(maintData?.data || []).slice(0, 10).map((m: any) => (
            <div key={m.id} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span>{m.title} · {m.vehicle?.name}</span>
              <span className="font-semibold">{m.totalCost} {m.currency}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
