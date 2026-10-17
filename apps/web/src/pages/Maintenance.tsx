import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiDelete, apiPatch } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/Dialog";
import { Plus, Trash2, Wrench } from "lucide-react";

const categories = ["ENGINE_OIL","OIL_FILTER","AIR_FILTER","CABIN_FILTER","FUEL_FILTER","BRAKES","TIRES","BATTERY","COOLING","FLUIDS","TRANSMISSION","SUSPENSION","STEERING","ELECTRICAL","INSPECTION","GENERAL_SERVICE","REPAIR","OTHER"];

export default function Maintenance() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const qk = ["maintenance", vehicleId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => apiGet<any>(vehicleId ? `/vehicles/${vehicleId}/maintenance` : `/maintenance`) });
  const records = data?.data || [];

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", category: "GENERAL_SERVICE", title: "", serviceDate: new Date().toISOString().slice(0, 10), odometer: "", partsCost: "", laborCost: "", totalCost: "", currency: "USD", notes: "", nextDueDate: "" });

  const createMut = useMutation({
    mutationFn: (p: any) => apiPost(vehicleId ? `/vehicles/${vehicleId}/maintenance` : `/vehicles/${p.vehicleId}/maintenance`, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setOpen(false); },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      vehicleId: form.vehicleId,
      category: form.category,
      title: form.title,
      serviceDate: form.serviceDate,
      odometer: form.odometer ? Number(form.odometer) : null,
      partsCost: form.partsCost ? Number(form.partsCost) : null,
      laborCost: form.laborCost ? Number(form.laborCost) : null,
      totalCost: form.totalCost ? Number(form.totalCost) : null,
      currency: form.currency,
      notes: form.notes || null,
      nextDueDate: form.nextDueDate || null,
    };
    await createMut.mutateAsync(payload);
  }

  async function remove(id: string) {
    if (!confirm(t("common.confirm"))) return;
    await apiDelete(`/maintenance/${id}`);
    qc.invalidateQueries({ queryKey: qk });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("maintenance.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("maintenance.new")}</Button>
      </div>
      {records.length === 0 ? <EmptyState title={t("empty.noMaintenance")} /> : (
        <div className="space-y-3">
          {records.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.title} <span className="text-xs text-gray-500">({r.category})</span></p>
                  <p className="text-sm text-gray-500">{r.vehicle?.name} · {new Date(r.serviceDate).toLocaleDateString()} · {r.odometer} {r.odometerUnit}</p>
                  {r.totalCost != null && <p className="text-sm font-semibold">{r.totalCost} {r.currency}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("maintenance.new")}>
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label={t("expenses.vehicle")} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">--</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Select label={t("maintenance.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label={t("common.title" as any) || "Título"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label={t("maintenance.serviceDate")} type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
          <Input label={t("maintenance.odometer")} type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input label={t("maintenance.partsCost")} type="number" step="0.01" value={form.partsCost} onChange={(e) => setForm({ ...form, partsCost: e.target.value })} />
            <Input label={t("maintenance.laborCost")} type="number" step="0.01" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} />
            <Input label={t("maintenance.totalCost")} type="number" step="0.01" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} />
          </div>
          <Input label={t("maintenance.currency")} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <Input label={t("maintenance.nextDueDate")} type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
          <Textarea label={t("maintenance.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" loading={createMut.isPending}>{t("common.save")}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
