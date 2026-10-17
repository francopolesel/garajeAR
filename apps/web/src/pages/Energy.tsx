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

export default function Energy() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const qk = ["energy", vehicleId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => vehicleId ? apiGet<any>(`/vehicles/${vehicleId}/energy`) : Promise.resolve({ data: [] }) });
  // global: fetch per vehicle not available; fetch all energy via reports? We'll aggregate client-side by iterating vehicles
  const [allLogs, setAllLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (vehicleId) return;
    (async () => {
      const vs = vehicles.length ? vehicles : (await apiGet<any>("/vehicles")).data;
      const logs: any[] = [];
      for (const v of vs) {
        try {
          const r = await apiGet<any>(`/vehicles/${v.id}/energy`);
          logs.push(...(r.data || []).map((l: any) => ({ ...l, vehicle: v })));
        } catch {}
      }
      setAllLogs(logs.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    })();
  }, [vehicles, vehicleId]);

  const logs = vehicleId ? (data?.data || []) : allLogs;

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", eventType: "FUEL_FILLUP", quantity: "", quantityUnit: "L", eventDate: new Date().toISOString().slice(0, 10), odometer: "", totalCost: "", currency: "USD", station: "", fullTank: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      eventType: form.eventType,
      quantity: Number(form.quantity),
      quantityUnit: form.quantityUnit,
      eventDate: form.eventDate,
      odometer: form.odometer ? Number(form.odometer) : null,
      totalCost: form.totalCost ? Number(form.totalCost) : null,
      currency: form.currency,
      station: form.station || null,
      fullTank: form.fullTank,
    };
    await apiPost(`/vehicles/${form.vehicleId}/energy`, payload);
    qc.invalidateQueries({ queryKey: qk });
    setOpen(false);
  }

  async function remove(id: string, vid: string) {
    if (!confirm("Delete?")) return;
    await apiDelete(`/energy/${id}`);
    qc.invalidateQueries({ queryKey: qk });
    setAllLogs((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("energy.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("common.new")}</Button>
      </div>
      {logs.length === 0 ? <EmptyState title={t("energy.empty")} /> : (
        <div className="space-y-3">
          {logs.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{l.eventType === "FUEL_FILLUP" ? t("energy.fuelFillup") : t("energy.charging")} · {l.quantity} {l.quantityUnit}</p>
                  <p className="text-sm text-gray-500">{l.vehicle?.name} · {new Date(l.eventDate).toLocaleDateString()} · {l.station}</p>
                  {l.totalCost != null && <p className="text-sm font-semibold">{l.totalCost} {l.currency}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(l.id, l.vehicleId)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("energy.title")}>
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label={t("expenses.vehicle")} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">--</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Select label="Tipo" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
            <option value="FUEL_FILLUP">{t("energy.fuelFillup")}</option>
            <option value="CHARGING_SESSION">{t("energy.charging")}</option>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input label={t("energy.quantity")} type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Select label={t("energy.unit")} value={form.quantityUnit} onChange={(e) => setForm({ ...form, quantityUnit: e.target.value })}>
              <option value="L">L</option><option value="GAL_US">gal</option><option value="kWh">kWh</option>
            </Select>
          </div>
          <Input label={t("energy.date")} type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <Input label={t("maintenance.odometer")} type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
          <Input label={t("energy.totalCost")} type="number" step="0.01" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} />
          <Input label={t("expenses.currency")} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <Input label={t("energy.station")} value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.fullTank} onChange={(e) => setForm({ ...form, fullTank: e.target.checked })} />
            {t("energy.fullTank")}
          </label>
          <div className="flex gap-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
