import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const energySchema = z.object({
  eventType: z.enum(["FUEL_FILLUP", "CHARGING_SESSION"]),
  subtype: z.string().optional().nullable(),
  quantity: z.number().positive(),
  quantityUnit: z.string(),
  eventDate: z.string(),
  odometer: z.number().optional().nullable(),
  odometerUnit: z.string().optional().nullable(),
  totalCost: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  fullTank: z.boolean().optional().default(false),
  station: z.string().optional().nullable(),
  chargingType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function ownedVehicle(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

router.get("/vehicles/:vehicleId/energy", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const v = await ownedVehicle(user.id, req.params.vehicleId);
    if (!v) throw notFound();
    const logs = await prisma.energyLog.findMany({
      where: { vehicleId: req.params.vehicleId, userId: user.id },
      orderBy: { eventDate: "desc" },
    });
    res.json({ data: logs });
  } catch (e) { next(e); }
});

router.post("/vehicles/:vehicleId/energy", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const v = await ownedVehicle(user.id, req.params.vehicleId);
    if (!v) throw notFound();
    const data = energySchema.parse(req.body);
    const currency = data.currency || user.currency;
    const log = await prisma.$transaction(async (tx: any) => {
      const l = await tx.energyLog.create({
        data: {
          userId: user.id,
          vehicleId: req.params.vehicleId,
          eventType: data.eventType,
          subtype: data.subtype ?? null,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          eventDate: new Date(data.eventDate),
          odometer: data.odometer ?? null,
          odometerUnit: data.odometerUnit ?? null,
          totalCost: data.totalCost ?? null,
          currency: currency ?? null,
          fullTank: data.fullTank ?? false,
          station: data.station ?? null,
          chargingType: data.chargingType ?? null,
          notes: data.notes ?? null,
        },
      });
      if (data.totalCost && data.totalCost > 0) {
        await tx.expense.create({
          data: {
            userId: user.id,
            vehicleId: req.params.vehicleId,
            category: data.eventType === "FUEL_FILLUP" ? "FUEL" : "CHARGING",
            title: data.eventType === "FUEL_FILLUP" ? "Fuel fill-up" : "Charging session",
            amount: data.totalCost,
            currency: currency!,
            expenseDate: new Date(data.eventDate),
            odometer: data.odometer ?? null,
            notes: data.notes ?? null,
            energyLogId: l.id,
          },
        });
      }
      if (data.odometer != null) {
        await tx.vehicle.update({ where: { id: req.params.vehicleId }, data: { currentOdometer: data.odometer, odometerUnit: data.odometerUnit || v.odometerUnit } });
      }
      return l;
    });
    res.status(201).json({ data: log });
  } catch (e) { next(e); }
});

router.get("/energy/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const l = await prisma.energyLog.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!l) throw notFound();
    res.json({ data: l });
  } catch (e) { next(e); }
});

router.patch("/energy/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.energyLog.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const data = energySchema.partial().parse(req.body);
    await prisma.$transaction(async (tx: any) => {
      await tx.energyLog.update({
        where: { id: req.params.id },
        data: {
          ...("eventType" in data ? { eventType: data.eventType! } : {}),
          ...("subtype" in data ? { subtype: data.subtype ?? null } : {}),
          ...("quantity" in data ? { quantity: data.quantity! } : {}),
          ...("quantityUnit" in data ? { quantityUnit: data.quantityUnit! } : {}),
          ...("eventDate" in data ? { eventDate: new Date(data.eventDate!) } : {}),
          ...("odometer" in data ? { odometer: data.odometer ?? null } : {}),
          ...("odometerUnit" in data ? { odometerUnit: data.odometerUnit ?? null } : {}),
          ...("totalCost" in data ? { totalCost: data.totalCost ?? null } : {}),
          ...("currency" in data ? { currency: data.currency ?? null } : {}),
          ...("fullTank" in data ? { fullTank: data.fullTank! } : {}),
          ...("station" in data ? { station: data.station ?? null } : {}),
          ...("chargingType" in data ? { chargingType: data.chargingType ?? null } : {}),
          ...("notes" in data ? { notes: data.notes ?? null } : {}),
        },
      });
      const linked = await tx.expense.findUnique({ where: { energyLogId: req.params.id } });
      const newTotal = data.totalCost ?? Number(existing.totalCost ?? 0);
      const newCurrency = (data.currency ?? existing.currency) || user.currency;
      if (linked) {
        if (newTotal > 0) {
          await tx.expense.update({
            where: { id: linked.id },
            data: {
              amount: newTotal,
              currency: newCurrency,
              expenseDate: data.eventDate ? new Date(data.eventDate) : existing.eventDate,
              odometer: data.odometer ?? existing.odometer ?? null,
              notes: data.notes ?? existing.notes ?? null,
            },
          });
        } else {
          await tx.expense.delete({ where: { id: linked.id } });
        }
      } else if (newTotal > 0) {
        await tx.expense.create({
          data: {
            userId: user.id,
            vehicleId: existing.vehicleId,
            category: (data.eventType ?? existing.eventType) === "FUEL_FILLUP" ? "FUEL" : "CHARGING",
            title: (data.eventType ?? existing.eventType) === "FUEL_FILLUP" ? "Fuel fill-up" : "Charging session",
            amount: newTotal,
            currency: newCurrency,
            expenseDate: data.eventDate ? new Date(data.eventDate) : existing.eventDate,
            odometer: data.odometer ?? existing.odometer ?? null,
            notes: data.notes ?? existing.notes ?? null,
            energyLogId: req.params.id,
          },
        });
      }
    });
    const updated = await prisma.energyLog.findUnique({ where: { id: req.params.id } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/energy/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.energyLog.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    await prisma.$transaction(async (tx: any) => {
      await tx.expense.deleteMany({ where: { energyLogId: req.params.id } });
      await tx.energyLog.delete({ where: { id: req.params.id } });
    });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
