import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";

export default function Finance() {
  const qc = useQueryClient();
  const [rate, setRate] = useState<any>({ fromCurrency: "USD", toCurrency: "ARS", rate: "", rateType: "manual", quoteDate: new Date().toISOString().slice(0, 10) });
  const [inf, setInf] = useState<any>({ amount: "", country: "AR", series: "IPC", transactionYearMonth: "", referenceYearMonth: "" });

  const { data } = useQuery({ queryKey: ["rates"], queryFn: () => apiGet<any>("/finance/exchange-rates") });
  const rates = data?.data || [];
  const { data: cpiData } = useQuery({ queryKey: ["cpi"], queryFn: () => apiGet<any>("/finance/cpi") });
  const cpi = cpiData?.data || [];

  const [infResult, setInfResult] = useState<any>(null);

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    await apiPost("/finance/exchange-rates", { ...rate, rate: Number(rate.rate) });
    qc.invalidateQueries({ queryKey: ["rates"] });
  }
  async function runInf(e: React.FormEvent) {
    e.preventDefault();
    const r = await apiPost<any>("/finance/inflation/adjust", { amount: Number(inf.amount), country: inf.country, series: inf.series, transactionYearMonth: inf.transactionYearMonth, referenceYearMonth: inf.referenceYearMonth });
    setInfResult(r.data);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Finanzas históricas</h1>
      <Card>
        <CardHeader><CardTitle>Tipo de cambio manual</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveRate} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Desde" value={rate.fromCurrency} onChange={(e) => setRate({ ...rate, fromCurrency: e.target.value })} />
              <Input label="Hacia" value={rate.toCurrency} onChange={(e) => setRate({ ...rate, toCurrency: e.target.value })} />
            </div>
            <Input label="Tasa" type="number" step="0.00000001" value={rate.rate} onChange={(e) => setRate({ ...rate, rate: e.target.value })} />
            <Input label="Tipo de tasa" value={rate.rateType} onChange={(e) => setRate({ ...rate, rateType: e.target.value })} />
            <Input label="Fecha cotización" type="date" value={rate.quoteDate} onChange={(e) => setRate({ ...rate, quoteDate: e.target.value })} />
            <Button type="submit">Guardar tasa</Button>
          </form>
          <div className="mt-3">
            {rates.map((r: any) => <div key={r.id} className="text-sm py-1">{r.fromCurrency}/{r.toCurrency} · {r.rate} · {new Date(r.quoteDate).toLocaleDateString()} · {r.rateType}</div>)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ajuste por inflación (IPC)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={runInf} className="space-y-3">
            <Input label="Monto nominal" type="number" step="0.01" value={inf.amount} onChange={(e) => setInf({ ...inf, amount: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="País" value={inf.country} onChange={(e) => setInf({ ...inf, country: e.target.value })} />
              <Input label="Serie" value={inf.series} onChange={(e) => setInf({ ...inf, series: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Mes transacción (YYYY-MM)" value={inf.transactionYearMonth} onChange={(e) => setInf({ ...inf, transactionYearMonth: e.target.value })} />
              <Input label="Mes referencia (YYYY-MM)" value={inf.referenceYearMonth} onChange={(e) => setInf({ ...inf, referenceYearMonth: e.target.value })} />
            </div>
            <Button type="submit">Calcular</Button>
          </form>
          {infResult && (
            <div className="mt-3 text-sm">
              <p>Nominal: {infResult.nominal}</p>
              <p>Ajustado: {infResult.adjusted}</p>
              <p>Fuente: {infResult.source}</p>
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500">
            Índices cargados: {cpi.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
