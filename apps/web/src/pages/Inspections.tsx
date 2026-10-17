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

const results = ["APPROVED", "CONDITIONAL", "REJECTED", "PENDING", "OTHER"];

export default function Inspections() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const qk = ["inspections", vehicleId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => apiGet<any>(`/inspections${vehicleId ? `?vehicleId=${vehicleId}` : ""}`) });
  const items = data?.data || [];

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", inspectionType: "VTV", country: "", jurisdiction: "", inspectionDate: new Date().toISOString().slice(0, 10), expirationDate: "", result: "APPROVED", certificateNumber: "", center: "", odometer: "", cost: "", currency: "USD", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost(`/vehicles/${form.vehicleId}/inspections`, { ...form, odometer: form.odometer ? Number(form.odometer) : null, cost: form.cost ? Number(form.cost) : null, expirationDate: form.expirationDate || null });
    qc.invalidateQueries({ queryKey: qk });
    setOpen(false);
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await apiDelete(`/inspections/${id}`);
    qc.invalidateQueries({ queryKey: qk });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("inspections.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nueva</Button>
      </div>
      {items.length === 0 ? <EmptyState title="Sin inspecciones" /> : (
        <div className="space-y-2">
          {items.map((i: any) => (
            <Card key={i.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{i.inspectionType} · {i.result}</p>
                  <p className="text-sm text-gray-500">{i.vehicle?.name} · {new Date(i.inspectionDate).toLocaleDateString()} · {i.center}</p>
                  {i.expirationDate && <p className="text-xs text-amber-600">Vence: {new Date(i.expirationDate).toLocaleDateString()}</p>}
                  {i.cost != null && <p className="text-sm font-semibold">{i.cost} {i.currency}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(i.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva inspección">
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label="Vehículo" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">--</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Input label="Tipo" value={form.inspectionType} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })} />
          <Input label="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input label="Jurisdicción" value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} />
          <Input label="Fecha inspección" type="date" value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} />
          <Select label="Resultado" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>
            {results.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input label="Certificado" value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} />
          <Input label="Centro" value={form.center} onChange={(e) => setForm({ ...form, center: e.target.value })} />
          <Input label="Vencimiento" type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
          <Input label="Odómetro" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Costo" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <Input label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">Guardar</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
