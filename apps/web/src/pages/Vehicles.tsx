import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../lib/api";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/Dialog";
import { Plus, Search, Car } from "lucide-react";

export default function Vehicles() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const { data, refetch } = useQuery({ queryKey: ["vehicles", search, archived], queryFn: () => apiGet<any>(`/vehicles?search=${encodeURIComponent(search)}&archived=${archived}`) });
  const vehicles = data?.data || [];

  async function remove(id: string) {
    if (!confirm(t("vehicles.deleteConfirm"))) return;
    await apiDelete(`/vehicles/${id}`);
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("vehicles.title")}</h1>
        <Link to="/app/vehicles/new"><Button><Plus className="h-4 w-4" />{t("common.new")}</Button></Link>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setArchived(!archived)}>{archived ? "Activos" : "Archivados"}</Button>
      </div>
      {vehicles.length === 0 ? (
        <EmptyState title={t("empty.noVehicles")} action={<Link to="/app/vehicles/new"><Button>{t("vehicles.new")}</Button></Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <Card key={v.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  {v.photoUrl ? <img src={v.photoUrl} alt={v.name} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center"><Car className="h-5 w-5 text-brand-600" /></div>}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{v.name}</p>
                    <p className="text-xs text-gray-500 truncate">{v.make} {v.model} · {v.modelYear}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{v.currentOdometer} {v.odometerUnit}</p>
                <div className="flex gap-2 pt-2">
                  <Link to={`/app/vehicles/${v.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">{t("common.details")}</Button></Link>
                  <Link to={`/app/vehicles/${v.id}/edit`}><Button variant="ghost" size="sm">{t("common.edit")}</Button></Link>
                  <Button variant="ghost" size="sm" onClick={() => remove(v.id)} className="text-red-600">{t("common.delete")}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
