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
