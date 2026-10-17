import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiPatch } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const schema = z.object({
  type: z.string(), name: z.string().min(1), make: z.string().min(1), model: z.string().min(1),
  modelYear: z.coerce.number().int().min(1900).max(2100),
  trim: z.string().optional(), vin: z.string().optional(), registrationNumber: z.string().optional(),
  engine: z.string().optional(), displacement: z.coerce.number().optional().nullable(),
  transmission: z.string().optional(), powertrain: z.string().optional(), bodyStyle: z.string().optional(),
  color: z.string().optional(), purchaseDate: z.string().optional(), purchasePrice: z.coerce.number().optional().nullable(),
  purchaseCurrency: z.string().optional(), currentOdometer: z.coerce.number().min(0).default(0),
  odometerUnit: z.string().default("KM"), notes: z.string().optional(),
});

const types = ["CAR","SUV","MOTORCYCLE","PICKUP","VAN","TRUCK","OTHER"];
const powertrains = ["PETROL","DIESEL","LPG","CNG","HYBRID","PHEV","BEV","HYDROGEN","OTHER","UNKNOWN"];
const transmissions = ["MANUAL","AUTOMATIC","CVT","DCT","OTHER","UNKNOWN"];

export default function VehicleForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const isEdit = !!vehicleId;
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["vehicle", vehicleId], queryFn: () => apiGet<any>(`/vehicles/${vehicleId}`), enabled: isEdit });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data?.data) {
      const v = data.data;
      reset({ ...v, purchaseDate: v.purchaseDate ? v.purchaseDate.slice(0, 10) : "", displacement: v.displacement ?? "", purchasePrice: v.purchasePrice ?? "" });
    }
  }, [data, reset]);

  async function onSubmit(values: any) {
    const payload = { ...values, displacement: values.displacement === "" ? null : values.displacement, purchasePrice: values.purchasePrice === "" ? null : values.purchasePrice, purchaseDate: values.purchaseDate || null };
    if (isEdit) await apiPatch(`/vehicles/${vehicleId}`, payload);
    else await apiPost("/vehicles", payload);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    navigate("/app/vehicles");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? t("vehicles.edit") : t("vehicles.new")}</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
            <Select label={t("vehicles.type")} {...register("type")} error={errors.type?.message as string}>
              {types.map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
            <Input label={t("vehicles.name")} {...register("name")} error={errors.name?.message as string} />
            <Input label={t("vehicles.make")} {...register("make")} error={errors.make?.message as string} />
            <Input label={t("vehicles.model")} {...register("model")} error={errors.model?.message as string} />
            <Input label={t("vehicles.year")} type="number" {...register("modelYear")} error={errors.modelYear?.message as string} />
            <Input label={t("vehicles.trim")} {...register("trim")} />
            <Input label={t("vehicles.vin")} {...register("vin")} />
            <Input label={t("vehicles.plate")} {...register("registrationNumber")} />
            <Select label={t("vehicles.powertrain")} {...register("powertrain")}>
              {powertrains.map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
            <Select label={t("vehicles.transmission")} {...register("transmission")}>
              {transmissions.map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
            <Input label={t("vehicles.color")} {...register("color")} />
            <Input label={t("vehicles.odometer")} type="number" {...register("currentOdometer")} />
            <Select label="Unidad odómetro" {...register("odometerUnit")}>
              <option value="KM">KM</option><option value="MI">MI</option>
            </Select>
            <Input label={t("vehicles.purchaseDate")} type="date" {...register("purchaseDate")} />
            <Input label={t("vehicles.purchasePrice")} type="number" step="0.01" {...register("purchasePrice")} />
            <Input label="Moneda compra" {...register("purchaseCurrency")} />
            <div className="md:col-span-2">
              <Textarea label={t("vehicles.notes")} rows={3} {...register("notes")} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" loading={isSubmitting}>{t("common.save")}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/vehicles")}>{t("common.cancel")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
