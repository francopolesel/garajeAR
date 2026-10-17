import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function VehicleDetail() {
  const { t } = useTranslation();
  const { vehicleId } = useParams();
  const { data } = useQuery({ queryKey: ["vehicle", vehicleId], queryFn: () => apiGet<any>(`/vehicles/${vehicleId}`) });
  const v = data?.data;
  if (!v) return <div>{t("common.loading")}</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{v.name}</h1>
        <Link to={`/app/vehicles/${vehicleId}/edit`}><Button variant="outline">{t("common.edit")}</Button></Link>
      </div>
      {v.photoUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
          <img src={v.photoUrl} alt={v.name} className="w-full max-h-80 object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" id="photoInput" className="text-sm" />
        <Button size="sm" onClick={async () => {
          const input = document.getElementById("photoInput") as HTMLInputElement;
          const file = input.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.append("photo", file);
          const csrf = document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1];
          const apiUrl = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "";
          await fetch((apiUrl ? apiUrl.replace(/\/$/, "") : "") + `/api/v1/vehicles/${vehicleId}/photo`, { method: "POST", body: fd, credentials: "include", headers: csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {} });
          window.location.reload();
        }}>{t("commonExtra.uploadPhoto")}</Button>
      </div>
      <Card>
        <CardContent className="p-6 grid md:grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">{t("vehicles.make")}</p><p className="font-medium">{v.make} {v.model}</p></div>
          <div><p className="text-sm text-gray-500">{t("vehicles.year")}</p><p className="font-medium">{v.modelYear}</p></div>
          <div><p className="text-sm text-gray-500">{t("vehicles.type")}</p><p className="font-medium">{v.type}</p></div>
          <div><p className="text-sm text-gray-500">{t("vehicles.odometer")}</p><p className="font-medium">{v.currentOdometer} {v.odometerUnit}</p></div>
          <div><p className="text-sm text-gray-500">{t("vehicles.powertrain")}</p><p className="font-medium">{v.powertrain || "-"}</p></div>
          <div><p className="text-sm text-gray-500">{t("vehicles.plate")}</p><p className="font-medium">{v.registrationNumber || "-"}</p></div>
          {v.notes && <div className="md:col-span-2"><p className="text-sm text-gray-500">{t("vehicles.notes")}</p><p>{v.notes}</p></div>}
        </CardContent>
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to={`/app/vehicles/${vehicleId}/maintenance`}><Button variant="outline" className="w-full">Mantenimiento</Button></Link>
        <Link to={`/app/vehicles/${vehicleId}/energy`}><Button variant="outline" className="w-full">Combustible</Button></Link>
        <Link to={`/app/vehicles/${vehicleId}/expenses`}><Button variant="outline" className="w-full">Gastos</Button></Link>
        <Link to={`/app/vehicles/${vehicleId}/documents`}><Button variant="outline" className="w-full">Documentos</Button></Link>
      </div>
    </div>
  );
}
