import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const reminderSchema = z.object({
  vehicleId: z.string().optional().nullable(),
  category: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  dueOdometer: z.number().optional().nullable(),
  dueOdometerUnit: z.string().optional().nullable(),
  daysBefore: z.number().int().min(0).max(365).optional().default(7),
  distanceBefore: z.number().optional().nullable(),
});

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { status } = req.query as Record<string, string>;
    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id },
      include: { vehicle: { select: { id: true, name: true, currentOdometer: true, odometerUnit: true } } },
      orderBy: { dueDate: "asc" },
    });
    // filter by status if requested
    const now = new Date();
    let filtered = reminders;
    if (status) {
      filtered = reminders.filter((r: any) => {
        if (status === "completed") return !!r.completedAt;
        if (status === "snoozed") return !!r.snoozedUntil && r.snoozedUntil > now;
        const overdue = isOverdue(r, now);
        const dueSoon = isDueSoon(r, now);
        if (status === "overdue") return !r.completedAt && overdue;
        if (status === "upcoming") return !r.completedAt && !overdue;
        if (status === "due_soon") return !r.completedAt && dueSoon;
        return true;
      });
    }
    res.json({ data: filtered });
  } catch (e) { next(e); }
});

function isOverdue(r: { completedAt: Date | null; snoozedUntil: Date | null; dueDate: Date | null; dueOdometer: number | null; daysBefore: number }, now: Date) {
  if (r.completedAt) return false;
  if (r.snoozedUntil && r.snoozedUntil > now) return false;
  if (r.dueDate && r.dueDate < now) return true;
  return false;
}

function isDueSoon(r: { completedAt: Date | null; snoozedUntil: Date | null; dueDate: Date | null; daysBefore: number }, now: Date) {
  if (r.completedAt) return false;
  if (!r.dueDate) return false;
  const threshold = new Date(r.dueDate.getTime() - r.daysBefore * 24 * 60 * 60 * 1000);
  return now >= threshold && now < r.dueDate;
}

router.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = reminderSchema.parse(req.body);
    if (data.vehicleId) {
      const v = await prisma.vehicle.findFirst({ where: { id: data.vehicleId, userId: user.id } });
      if (!v) throw notFound();
    }
    const reminder = await prisma.reminder.create({
      data: {
        userId: user.id,
        vehicleId: data.vehicleId ?? null,
        category: data.category,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        dueOdometer: data.dueOdometer ?? null,
        dueOdometerUnit: data.dueOdometerUnit ?? null,
        daysBefore: data.daysBefore ?? 7,
        distanceBefore: data.distanceBefore ?? null,
      },
    });
    res.status(201).json({ data: reminder });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const r = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!r) throw notFound();
    res.json({ data: r });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const data = reminderSchema.partial().parse(req.body);
    const updated = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        ...("vehicleId" in data ? { vehicleId: data.vehicleId ?? null } : {}),
        ...("category" in data ? { category: data.category! } : {}),
        ...("title" in data ? { title: data.title! } : {}),
        ...("description" in data ? { description: data.description ?? null } : {}),
        ...("dueDate" in data ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...("dueOdometer" in data ? { dueOdometer: data.dueOdometer ?? null } : {}),
        ...("dueOdometerUnit" in data ? { dueOdometerUnit: data.dueOdometerUnit ?? null } : {}),
        ...("daysBefore" in data ? { daysBefore: data.daysBefore! } : {}),
        ...("distanceBefore" in data ? { distanceBefore: data.distanceBefore ?? null } : {}),
      },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.post("/:id/complete", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const updated = await prisma.reminder.update({ where: { id: req.params.id }, data: { completedAt: new Date() } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.post("/:id/snooze", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const { until } = req.body as { until?: string };
    const snoozedUntil = until ? new Date(until) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated = await prisma.reminder.update({ where: { id: req.params.id }, data: { snoozedUntil } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
