import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiDelete, apiPatch } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/Dialog";
import { Plus, Check, Clock, Trash2 } from "lucide-react";

const cats = ["MAINTENANCE","INSURANCE","REGISTRATION","INSPECTION","TAXES","TIRES","BATTERY","DOCUMENT","CUSTOM"];

export default function Reminders() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const { data } = useQuery({ queryKey: ["reminders", vehicleId], queryFn: () => apiGet<any>("/reminders") });
  const reminders = (data?.data || []).filter((r: any) => !vehicleId || r.vehicleId === vehicleId);

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", category: "CUSTOM", title: "", description: "", dueDate: "", dueOdometer: "", daysBefore: 7 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost("/reminders", { ...form, dueOdometer: form.dueOdometer ? Number(form.dueOdometer) : null, dueDate: form.dueDate || null });
    qc.invalidateQueries({ queryKey: ["reminders"] });
    setOpen(false);
  }
  async function complete(id: string) { await apiPost(`/reminders/${id}/complete`); qc.invalidateQueries({ queryKey: ["reminders"] }); }
  async function snooze(id: string) { await apiPost(`/reminders/${id}/snooze`, { until: new Date(Date.now() + 7*86400000).toISOString() }); qc.invalidateQueries({ queryKey: ["reminders"] }); }
  async function remove(id: string) { if (!confirm("Delete?")) return; await apiDelete(`/reminders/${id}`); qc.invalidateQueries({ queryKey: ["reminders"] }); }

  const now = new Date();
  function status(r: any) {
    if (r.completedAt) return "completed";
    if (r.snoozedUntil && new Date(r.snoozedUntil) > now) return "snoozed";
    if (r.dueDate && new Date(r.dueDate) < now) return "overdue";
    return "upcoming";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("reminders.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("reminders.new")}</Button>
      </div>
      {reminders.length === 0 ? <EmptyState title={t("empty.noReminders" as any) || t("reminders.empty")} /> : (
        <div className="space-y-2">
          {reminders.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-500">{r.vehicle?.name} · {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ""} {r.dueOdometer ? `· ${r.dueOdometer} km` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status(r) === "overdue" ? "bg-red-100 text-red-700" : status(r) === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{status(r)}</span>
                  {!r.completedAt && <>
                    <Button size="sm" variant="outline" onClick={() => complete(r.id)}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => snooze(r.id)}><Clock className="h-3 w-3" /></Button>
                  </>}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("reminders.new")}>
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label={t("expenses.vehicle")} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">General</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Input label={t("reminders.title" as any) || "Título"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label={t("reminders.category" as any) || "Categoría"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label={t("reminders.dueDate")} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label={t("reminders.dueOdometer")} type="number" value={form.dueOdometer} onChange={(e) => setForm({ ...form, dueOdometer: e.target.value })} />
          <Input label={t("reminders.daysBefore")} type="number" value={form.daysBefore} onChange={(e) => setForm({ ...form, daysBefore: Number(e.target.value) })} />
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
