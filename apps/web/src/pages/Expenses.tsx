import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/Dialog";
import { Plus, Trash2 } from "lucide-react";

const cats = ["FUEL","CHARGING","MAINTENANCE","REPAIRS","INSURANCE","TAXES_REGISTRATION","INSPECTIONS","PARKING","TOLLS","CLEANING","ACCESSORIES","FINANCING","FINES","OTHER"];

export default function Expenses() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const qk = ["expenses", vehicleId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => apiGet<any>(`/expenses${vehicleId ? `?vehicleId=${vehicleId}` : ""}`) });
  const expenses = data?.data || [];

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", category: "OTHER", title: "", amount: "", currency: "USD", expenseDate: new Date().toISOString().slice(0, 10), paymentMethod: "", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost("/expenses", { ...form, amount: Number(form.amount), vehicleId: form.vehicleId || null });
    qc.invalidateQueries({ queryKey: qk });
    setOpen(false);
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await apiDelete(`/expenses/${id}`);
    qc.invalidateQueries({ queryKey: qk });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("expenses.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("expenses.new")}</Button>
      </div>
      {expenses.length === 0 ? <EmptyState title={t("empty.noExpenses")} /> : (
        <div className="space-y-2">
          {expenses.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{e.title} <span className="text-xs text-gray-500">({e.category})</span></p>
                  <p className="text-sm text-gray-500">{e.vehicle?.name} · {new Date(e.expenseDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{Number(e.amount).toFixed(2)} {e.currency}</p>
                  <Button variant="ghost" size="sm" onClick={() => remove(e.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("expenses.new")}>
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label={t("expenses.vehicle")} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">General</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Input label={t("expenses.title" as any) || "Título"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label={t("expenses.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input label={t("expenses.amount")} type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label={t("expenses.currency")} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <Input label={t("expenses.date")} type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <Input label={t("expenses.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
