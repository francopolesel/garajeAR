import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/dashboard", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const [vehicles, upcomingReminders, overdueReminders, monthExpenses, recentMaintenance, recentEnergy] = await Promise.all([
      prisma.vehicle.count({ where: { userId: user.id, archived: false } }),
      prisma.reminder.count({ where: { userId: user.id, completedAt: null, dueDate: { gte: now } } }),
      prisma.reminder.count({ where: { userId: user.id, completedAt: null, dueDate: { lt: now } } }),
      prisma.expense.aggregate({ where: { userId: user.id, expenseDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.maintenanceRecord.findMany({ where: { userId: user.id }, orderBy: { serviceDate: "desc" }, take: 5, include: { vehicle: { select: { name: true } } } }),
      prisma.energyLog.findMany({ where: { userId: user.id }, orderBy: { eventDate: "desc" }, take: 5, include: { vehicle: { select: { name: true } } } }),
    ]);
    // spending by currency this month
    const monthByCurrency = await prisma.expense.groupBy({
      by: ["currency"],
      where: { userId: user.id, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });
    // documents expiring soon
    const expiringDocs = await prisma.document.count({ where: { userId: user.id, expirationDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } } });
    res.json({
      data: {
        activeVehicles: vehicles,
        upcomingReminders,
        overdueReminders,
        monthExpensesTotal: monthExpenses._sum.amount,
        monthExpensesByCurrency: monthByCurrency.map((g) => ({ currency: g.currency, total: g._sum.amount })),
        recentMaintenance,
        recentEnergy,
        expiringDocuments: expiringDocs,
      },
    });
  } catch (e) { next(e); }
});

router.get("/spending-trend", async (req: AuthedRequest, res, next) => {
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
    const expenses = await prisma.expense.findMany({ where, select: { amount: true, currency: true, expenseDate: true, category: true } });
    res.json({ data: expenses });
  } catch (e) { next(e); }
});

router.get("/energy-stats", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    const logs = await prisma.energyLog.findMany({ where, orderBy: { eventDate: "asc" } });
    res.json({ data: logs });
  } catch (e) { next(e); }
});

router.get("/maintenance-status", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    const records = await prisma.maintenanceRecord.findMany({ where, orderBy: { serviceDate: "desc" }, include: { vehicle: { select: { name: true } } } });
    res.json({ data: records });
  } catch (e) { next(e); }
});

export default router;
