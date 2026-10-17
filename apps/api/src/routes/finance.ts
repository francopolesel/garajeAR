import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";
import { convertWithRate, inflationAdjust } from "../lib/finance.js";

const router = Router();
router.use(authMiddleware);

// Manual exchange rate snapshot
const rateSchema = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.number().positive(),
  rateType: z.string(),
  provider: z.string().default("manual"),
  quoteDate: z.string(),
  transactionDate: z.string().optional().nullable(),
  manualOverride: z.boolean().default(true),
});

router.post("/exchange-rates", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = rateSchema.parse(req.body);
    const snap = await prisma.exchangeRateSnapshot.create({
      data: {
        userId: user.id,
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        rate: data.rate,
        rateType: data.rateType,
        provider: data.provider,
        quoteDate: new Date(data.quoteDate),
        manualOverride: data.manualOverride,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : null,
      },
    });
    res.status(201).json({ data: snap });
  } catch (e) { next(e); }
});

router.get("/exchange-rates", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { from, to } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { OR: [{ userId: user.id }, { userId: null }] };
    if (from) where.fromCurrency = from;
    if (to) where.toCurrency = to;
    const items = await prisma.exchangeRateSnapshot.findMany({ where, orderBy: { quoteDate: "desc" }, take: 50 });
    res.json({ data: items });
  } catch (e) { next(e); }
});

// Convert an amount using a saved snapshot
router.post("/exchange-rates/convert", async (req: AuthedRequest, res, next) => {
  try {
    requireUser(req);
    const { amount, snapshotId } = req.body as { amount: number; snapshotId: string };
    const snap = await prisma.exchangeRateSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snap) throw notFound();
    const converted = convertWithRate(amount, Number(snap.rate));
    res.json({ data: { original: amount, converted, rate: snap.rate, quoteDate: snap.quoteDate, rateType: snap.rateType } });
  } catch (e) { next(e); }
});

// CPI index management
const cpiSchema = z.object({
  country: z.string(),
  series: z.string(),
  yearMonth: z.string(),
  indexValue: z.number().positive(),
  source: z.string(),
});

router.post("/cpi", async (req: AuthedRequest, res, next) => {
  try {
    requireUser(req);
    const data = cpiSchema.parse(req.body);
    const rec = await prisma.cpiIndex.upsert({
      where: { country_series_yearMonth: { country: data.country, series: data.series, yearMonth: data.yearMonth } },
      update: { indexValue: data.indexValue, source: data.source },
      create: data,
    });
    res.status(201).json({ data: rec });
  } catch (e) { next(e); }
});

router.get("/cpi", async (req: AuthedRequest, res, next) => {
  try {
    requireUser(req);
    const { country, series } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (series) where.series = series;
    const items = await prisma.cpiIndex.findMany({ where, orderBy: { yearMonth: "asc" } });
    res.json({ data: items });
  } catch (e) { next(e); }
});

router.post("/inflation/adjust", async (req: AuthedRequest, res, next) => {
  try {
    requireUser(req);
    const { amount, country, series, transactionYearMonth, referenceYearMonth } = req.body as { amount: number; country: string; series: string; transactionYearMonth: string; referenceYearMonth: string };
    const tIdx = await prisma.cpiIndex.findUnique({ where: { country_series_yearMonth: { country, series, yearMonth: transactionYearMonth } } });
    const rIdx = await prisma.cpiIndex.findUnique({ where: { country_series_yearMonth: { country, series, yearMonth: referenceYearMonth } } });
    if (!tIdx || !rIdx) throw badRequest("Missing CPI index for one of the periods");
    const adjusted = inflationAdjust(amount, Number(tIdx.indexValue), Number(rIdx.indexValue));
    res.json({ data: { nominal: amount, adjusted, transactionYearMonth, referenceYearMonth, transactionIndex: tIdx.indexValue, referenceIndex: rIdx.indexValue, source: tIdx.source } });
  } catch (e) { next(e); }
});

export default router;
