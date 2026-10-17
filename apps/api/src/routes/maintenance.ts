import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const maintenanceSchema = z.object({
  vehicleId: z.string(),
  category: z.string(),
  title: z.string().min(1).max(200),
  serviceDate: z.string(),
  odometer: z.number().optional().nullable(),
  odometerUnit: z.string().optional().nullable(),
  workshop: z.string().optional().nullable(),
  partsCost: z.number().optional().nullable(),
  laborCost: z.number().optional().nullable(),
  totalCost: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  partsNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  nextDueDate: z.string().optional().nullable(),
  nextDueOdometer: z.number().optional().nullable(),
});

async function ownedVehicle(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

router.get("/vehicles/:vehicleId/maintenance", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const v = await ownedVehicle(user.id, req.params.vehicleId);
    if (!v) throw notFound();
    const records = await prisma.maintenanceRecord.findMany({
      where: { vehicleId: req.params.vehicleId, userId: user.id },
      orderBy: { serviceDate: "desc" },
    });
    res.json({ data: records });
  } catch (e) { next(e); }
});

router.post("/vehicles/:vehicleId/maintenance", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const v = await ownedVehicle(user.id, req.params.vehicleId);
    if (!v) throw notFound();
    const data = maintenanceSchema.omit({ vehicleId: true }).parse(req.body);
    const computed = (data.partsCost ?? 0) + (data.laborCost ?? 0);
    const totalCost = data.totalCost ?? (computed > 0 ? computed : null);
    const currency = data.currency || user.currency;
    const record = await prisma.$transaction(async (tx: any) => {
      const r = await tx.maintenanceRecord.create({
        data: {
          userId: user.id,
          vehicleId: req.params.vehicleId,
          category: data.category,
          title: data.title,
          serviceDate: new Date(data.serviceDate),
          odometer: data.odometer ?? null,
          odometerUnit: data.odometerUnit ?? null,
          workshop: data.workshop ?? null,
          partsCost: data.partsCost ?? null,
          laborCost: data.laborCost ?? null,
          totalCost: totalCost ?? null,
          currency: currency ?? null,
          partsNotes: data.partsNotes ?? null,
          notes: data.notes ?? null,
          nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
          nextDueOdometer: data.nextDueOdometer ?? null,
        },
      });
      if (totalCost && totalCost > 0) {
        await tx.expense.create({
          data: {
            userId: user.id,
            vehicleId: req.params.vehicleId,
            category: "MAINTENANCE",
            title: data.title,
            amount: totalCost,
            currency: currency!,
            expenseDate: new Date(data.serviceDate),
            odometer: data.odometer ?? null,
            notes: data.notes ?? null,
            maintenanceRecordId: r.id,
          },
        });
      }
      if (data.odometer != null) {
        await tx.odometerReading.create({
          data: { userId: user.id, vehicleId: req.params.vehicleId, value: data.odometer, unit: data.odometerUnit || v.odometerUnit, observedAt: new Date(data.serviceDate), source: "maintenance" },
        }).catch(() => {});
        await tx.vehicle.update({ where: { id: req.params.vehicleId }, data: { currentOdometer: data.odometer, odometerUnit: data.odometerUnit || v.odometerUnit } });
      }
      return r;
    });
    res.status(201).json({ data: record });
  } catch (e) { next(e); }
});

router.get("/maintenance", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    const records = await prisma.maintenanceRecord.findMany({ where, orderBy: { serviceDate: "desc" }, include: { vehicle: { select: { id: true, name: true } } } });
    res.json({ data: records });
  } catch (e) { next(e); }
});

router.get("/maintenance/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const r = await prisma.maintenanceRecord.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!r) throw notFound();
    res.json({ data: r });
  } catch (e) { next(e); }
});

router.patch("/maintenance/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.maintenanceRecord.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const data = maintenanceSchema.partial().omit({ vehicleId: true }).parse(req.body);
    const totalCost = data.totalCost ?? (data.partsCost != null || data.laborCost != null
      ? (data.partsCost ?? Number(existing.partsCost ?? 0)) + (data.laborCost ?? Number(existing.laborCost ?? 0))
      : undefined);
    await prisma.$transaction(async (tx: any) => {
      await tx.maintenanceRecord.update({
        where: { id: req.params.id },
        data: {
          ...("category" in data ? { category: data.category! } : {}),
          ...("title" in data ? { title: data.title! } : {}),
          ...("serviceDate" in data ? { serviceDate: new Date(data.serviceDate!) } : {}),
          ...("odometer" in data ? { odometer: data.odometer ?? null } : {}),
          ...("odometerUnit" in data ? { odometerUnit: data.odometerUnit ?? null } : {}),
          ...("workshop" in data ? { workshop: data.workshop ?? null } : {}),
          ...("partsCost" in data ? { partsCost: data.partsCost ?? null } : {}),
          ...("laborCost" in data ? { laborCost: data.laborCost ?? null } : {}),
          ...("totalCost" in data ? { totalCost: data.totalCost ?? null } : (totalCost != null ? { totalCost } : {})),
          ...("currency" in data ? { currency: data.currency ?? null } : {}),
          ...("partsNotes" in data ? { partsNotes: data.partsNotes ?? null } : {}),
          ...("notes" in data ? { notes: data.notes ?? null } : {}),
          ...("nextDueDate" in data ? { nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null } : {}),
          ...("nextDueOdometer" in data ? { nextDueOdometer: data.nextDueOdometer ?? null } : {}),
        },
      });
      // sync expense
      const linked = await tx.expense.findUnique({ where: { maintenanceRecordId: req.params.id } });
      const newTotal = totalCost ?? Number(existing.totalCost ?? 0);
      const newCurrency = (data.currency ?? existing.currency) || user.currency;
      if (linked) {
        if (newTotal > 0) {
          await tx.expense.update({
            where: { id: linked.id },
            data: {
              title: data.title ?? existing.title,
              amount: newTotal,
              currency: newCurrency,
              expenseDate: data.serviceDate ? new Date(data.serviceDate) : existing.serviceDate,
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
            category: "MAINTENANCE",
            title: data.title ?? existing.title,
            amount: newTotal,
            currency: newCurrency,
            expenseDate: data.serviceDate ? new Date(data.serviceDate) : existing.serviceDate,
            odometer: data.odometer ?? existing.odometer ?? null,
            notes: data.notes ?? existing.notes ?? null,
            maintenanceRecordId: req.params.id,
          },
        });
      }
    });
    const updated = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/maintenance/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.maintenanceRecord.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    await prisma.$transaction(async (tx: any) => {
      await tx.expense.deleteMany({ where: { maintenanceRecordId: req.params.id } });
      await tx.maintenanceRecord.delete({ where: { id: req.params.id } });
    });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
