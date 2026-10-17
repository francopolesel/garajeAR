import { prisma } from "./prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

// Historical conversion snapshot calculation
export function convertWithRate(amount: number, rate: number, direction: "multiply" | "divide" = "multiply"): number {
  const r = direction === "multiply" ? amount * rate : amount / rate;
  return Math.round(r * 100) / 100;
}

export function inflationAdjust(nominal: number, transactionMonthIndex: number, referenceMonthIndex: number): number {
  if (transactionMonthIndex === 0) throw new Error("Invalid transaction month index");
  const r = nominal * (referenceMonthIndex / transactionMonthIndex);
  return Math.round(r * 100) / 100;
}

export async function getLatestCpiIndex(country: string, series: string, yearMonth: string) {
  return prisma.cpiIndex.findUnique({ where: { country_series_yearMonth: { country, series, yearMonth } } });
}

export async function getRateSnapshot(from: string, to: string, onOrBefore: Date) {
  return prisma.exchangeRateSnapshot.findFirst({
    where: { fromCurrency: from, toCurrency: to, quoteDate: { lte: onOrBefore } },
    orderBy: { quoteDate: "desc" },
  });
}
