import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const expenseSchema = z.object({
  vehicleId: z.string().optional().nullable(),
  category: z.string(),
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string(),
  expenseDate: z.string(),
  paymentMethod: z.string().optional().nullable(),
  odometer: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId, category, currency, from, to, search, page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    if (category) where.category = category;
    if (currency) where.currency = currency;
    if (from || to) {
      where.expenseDate = {};
      if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to);
    }
    if (search) where.title = { contains: search, mode: "insensitive" };
    const p = parseInt(page, 10);
    const ps = Math.min(parseInt(pageSize, 10), 200);
    const [items, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: "desc" }, skip: (p - 1) * ps, take: ps, include: { vehicle: { select: { id: true, name: true } } } }),
      prisma.expense.count({ where }),
    ]);
    res.json({ data: items, pagination: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
  } catch (e) { next(e); }
});

router.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = expenseSchema.parse(req.body);
    if (data.vehicleId) {
      const v = await prisma.vehicle.findFirst({ where: { id: data.vehicleId, userId: user.id } });
      if (!v) throw notFound();
    }
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        vehicleId: data.vehicleId ?? null,
        category: data.category,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        expenseDate: new Date(data.expenseDate),
        paymentMethod: data.paymentMethod ?? null,
        odometer: data.odometer ?? null,
        notes: data.notes ?? null,
      },
    });
    res.status(201).json({ data: expense });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const e = await prisma.expense.findFirst({ where: { id: req.params.id, userId: user.id }, include: { vehicle: true } });
    if (!e) throw notFound();
    res.json({ data: e });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    // prevent editing linked expenses' core amount? allow
    if (existing.maintenanceRecordId || existing.energyLogId) {
      // allow notes/title/date edits but amount synced from source; still allow amount override? We'll allow all.
    }
    const data = expenseSchema.partial().parse(req.body);
    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...("vehicleId" in data ? { vehicleId: data.vehicleId ?? null } : {}),
        ...("category" in data ? { category: data.category! } : {}),
        ...("title" in data ? { title: data.title! } : {}),
        ...("amount" in data ? { amount: data.amount! } : {}),
        ...("currency" in data ? { currency: data.currency! } : {}),
        ...("expenseDate" in data ? { expenseDate: new Date(data.expenseDate!) } : {}),
        ...("paymentMethod" in data ? { paymentMethod: data.paymentMethod ?? null } : {}),
        ...("odometer" in data ? { odometer: data.odometer ?? null } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
      },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    if (existing.maintenanceRecordId || existing.energyLogId) {
      // deleting a manual-linked expense? The source remains; just delete expense row. But to keep consistency, we allow.
    }
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

// summaries
router.get("/summary/by-category", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { from, to, vehicleId, currency } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    if (currency) where.currency = currency;
    if (from || to) {
      where.expenseDate = {};
      if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to);
    }
    const groups = await prisma.expense.groupBy({
      by: ["category", "currency"],
      where,
      _sum: { amount: true },
      _count: true,
    });
    res.json({ data: groups.map((g) => ({ category: g.category, currency: g.currency, total: g._sum.amount, count: g._count })) });
  } catch (e) { next(e); }
});

router.get("/summary/by-vehicle", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { from, to, currency } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id, vehicleId: { not: null } };
    if (currency) where.currency = currency;
    if (from || to) {
      where.expenseDate = {};
      if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to);
    }
    const groups = await prisma.expense.groupBy({
      by: ["vehicleId", "currency"],
      where,
      _sum: { amount: true },
      _count: true,
    });
    const vehicles = await prisma.vehicle.findMany({ where: { userId: user.id }, select: { id: true, name: true } });
    const vmap = new Map(vehicles.map((v) => [v.id, v.name]));
    res.json({ data: groups.map((g) => ({ vehicleId: g.vehicleId, vehicleName: vmap.get(g.vehicleId!) || "Unknown", currency: g.currency, total: g._sum.amount, count: g._count })) });
  } catch (e) { next(e); }
});

router.get("/summary/monthly", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { from, to, vehicleId, currency } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    if (currency) where.currency = currency;
    if (from || to) {
      where.expenseDate = {};
      if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to);
    }
    const expenses = await prisma.expense.findMany({ where, select: { amount: true, currency: true, expenseDate: true } });
    const map = new Map<string, Record<string, number>>();
    for (const e of expenses) {
      const key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, {});
      const cur = map.get(key)!;
      cur[e.currency] = (cur[e.currency] || 0) + Number(e.amount);
    }
    const data = Array.from(map.entries()).map(([month, totals]) => ({ month, totals })).sort((a, b) => a.month.localeCompare(b.month));
    res.json({ data });
  } catch (e) { next(e); }
});

export default router;
