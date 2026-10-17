import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const inspectionSchema = z.object({
  vehicleId: z.string(),
  inspectionType: z.string(),
  country: z.string().optional().nullable(),
  jurisdiction: z.string().optional().nullable(),
  inspectionDate: z.string(),
  expirationDate: z.string().optional().nullable(),
  result: z.string(),
  certificateNumber: z.string().optional().nullable(),
  center: z.string().optional().nullable(),
  odometer: z.number().optional().nullable(),
  odometerUnit: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  reinspectionDeadline: z.string().optional().nullable(),
  defects: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get("/inspections", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    const items = await prisma.inspection.findMany({ where, include: { vehicle: { select: { id: true, name: true } } }, orderBy: { inspectionDate: "desc" } });
    res.json({ data: items });
  } catch (e) { next(e); }
});

router.post("/vehicles/:vehicleId/inspections", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const v = await prisma.vehicle.findFirst({ where: { id: req.params.vehicleId, userId: user.id } });
    if (!v) throw notFound();
    const data = inspectionSchema.omit({ vehicleId: true }).parse(req.body);
    const insp = await prisma.$transaction(async (tx) => {
      const r = await tx.inspection.create({
        data: {
          userId: user.id, vehicleId: req.params.vehicleId, inspectionType: data.inspectionType,
          country: data.country ?? null, jurisdiction: data.jurisdiction ?? null,
          inspectionDate: new Date(data.inspectionDate), expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          result: data.result, certificateNumber: data.certificateNumber ?? null, center: data.center ?? null,
          odometer: data.odometer ?? null, odometerUnit: data.odometerUnit ?? null, cost: data.cost ?? null,
          currency: data.currency ?? null, reinspectionDeadline: data.reinspectionDeadline ? new Date(data.reinspectionDeadline) : null,
          defects: data.defects ?? null, notes: data.notes ?? null,
        },
      });
      if (data.cost && data.cost > 0) {
        await tx.expense.create({
          data: { userId: user.id, vehicleId: req.params.vehicleId, category: "INSPECTIONS", title: `Inspection ${data.inspectionType}`, amount: data.cost, currency: (data.currency || user.currency), expenseDate: new Date(data.inspectionDate), odometer: data.odometer ?? null, notes: data.notes ?? null },
        });
      }
      if (data.expirationDate) {
        await tx.reminder.create({
          data: { userId: user.id, vehicleId: req.params.vehicleId, category: "INSPECTION", title: `Inspection expires: ${data.inspectionType}`, dueDate: new Date(data.expirationDate), daysBefore: 30 },
        });
      }
      return r;
    });
    res.status(201).json({ data: insp });
  } catch (e) { next(e); }
});

router.get("/inspections/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const r = await prisma.inspection.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!r) throw notFound();
    res.json({ data: r });
  } catch (e) { next(e); }
});

router.delete("/inspections/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.inspection.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    await prisma.inspection.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
