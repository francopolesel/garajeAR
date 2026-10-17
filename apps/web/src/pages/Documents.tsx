import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiDelete } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/Dialog";
import { Plus, Download, Trash2, FileText } from "lucide-react";

const cats = ["INSURANCE","REGISTRATION","INSPECTION","OWNERSHIP","INVOICE","SERVICE_RECEIPT","WARRANTY","MANUAL","OTHER"];

export default function Documents() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehiclesData } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<any>("/vehicles") });
  const vehicles = vehiclesData?.data || [];
  const qk = ["documents", vehicleId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => apiGet<any>(`/documents${vehicleId ? `?vehicleId=${vehicleId}` : ""}`) });
  const docs = data?.data || [];

  const [form, setForm] = useState<any>({ vehicleId: vehicleId || "", category: "OTHER", name: "", issueDate: "", expirationDate: "", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("vehicleId", form.vehicleId);
    fd.append("category", form.category);
    if (form.name) fd.append("name", form.name);
    if (form.issueDate) fd.append("issueDate", form.issueDate);
    if (form.expirationDate) fd.append("expirationDate", form.expirationDate);
    if (form.notes) fd.append("notes", form.notes);
    const csrf = document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1];
    const res = await fetch((import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ? (import.meta as { env?: { VITE_API_URL?: string } }).env!.VITE_API_URL!.replace(/\/$/, "") + "/api/v1/documents/upload" : "/api/v1/documents/upload", { method: "POST", body: fd, credentials: "include", headers: csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {} });
    if (!res.ok) throw new Error("Upload failed");
    qc.invalidateQueries({ queryKey: qk });
    setOpen(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await apiDelete(`/documents/${id}`);
    qc.invalidateQueries({ queryKey: qk });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("documents.title")}</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("documents.upload")}</Button>
      </div>
      {docs.length === 0 ? <EmptyState title={t("empty.noDocuments" as any) || t("documents.empty")} /> : (
        <div className="space-y-2">
          {docs.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.vehicle?.name} · {d.category} · {d.mimeType}</p>
                    {d.expirationDate && <p className="text-xs text-amber-600">Vence: {new Date(d.expirationDate).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`${(import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ? (import.meta as { env?: { VITE_API_URL?: string } }).env!.VITE_API_URL!.replace(/\/$/, "") : ""}/api/v1/documents/${d.id}/download`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => remove(d.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t("documents.upload")}>
        <form onSubmit={submit} className="space-y-3">
          {!vehicleId && (
            <Select label={t("expenses.vehicle")} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">--</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          )}
          <Input label={t("documents.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label={t("documents.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <input type="file" ref={fileRef} className="block w-full text-sm" />
          <Input label={t("documents.issueDate")} type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          <Input label={t("documents.expiration")} type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">{t("common.upload")}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
