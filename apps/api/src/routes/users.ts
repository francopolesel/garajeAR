import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { badRequest, unauthorized } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";
import { hashPassword, verifyPassword, destroyAllUserSessions } from "../lib/auth.js";
import { env, isProd } from "../lib/env.js";

const router = Router();
router.use(authMiddleware);

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  distanceUnit: z.string().optional(),
  volumeUnit: z.string().optional(),
  timeZone: z.string().optional(),
  theme: z.string().optional(),
});

router.get("/profile", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u) throw unauthorized();
    const { passwordHash, ...safe } = u;
    res.json({ data: safe });
  } catch (e) { next(e); }
});

router.patch("/profile", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = profileSchema.parse(req.body);
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
      if (existing && existing.id !== user.id) throw badRequest("Email in use");
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
        ...(data.locale ? { locale: data.locale } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
        ...(data.distanceUnit ? { distanceUnit: data.distanceUnit } : {}),
        ...(data.volumeUnit ? { volumeUnit: data.volumeUnit } : {}),
        ...(data.timeZone ? { timeZone: data.timeZone } : {}),
        ...(data.theme ? { theme: data.theme } : {}),
      },
    });
    const { passwordHash, ...safe } = updated;
    res.json({ data: safe });
  } catch (e) { next(e); }
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.post("/change-password", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = passwordSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u) throw unauthorized();
    const ok = await verifyPassword(u.passwordHash, data.currentPassword);
    if (!ok) throw badRequest("Current password incorrect");
    const hash = await hashPassword(data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    await destroyAllUserSessions(user.id);
    // re-create session
    const { createSession } = await import("../lib/auth.js");
    const token = await createSession(user.id);
    res.cookie("sid", token, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.get("/export", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const [vehicles, maintenance, energy, expenses, reminders, documents] = await Promise.all([
      prisma.vehicle.findMany({ where: { userId: user.id } }),
      prisma.maintenanceRecord.findMany({ where: { userId: user.id } }),
      prisma.energyLog.findMany({ where: { userId: user.id } }),
      prisma.expense.findMany({ where: { userId: user.id } }),
      prisma.reminder.findMany({ where: { userId: user.id } }),
      prisma.document.findMany({ where: { userId: user.id } }),
    ]);
    const data = { user: { id: user.id, name: user.name, email: user.email }, vehicles, maintenance, energy, expenses, reminders, documents, exportedAt: new Date().toISOString() };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=garajear-export.json");
    res.send(JSON.stringify(data, null, 2));
  } catch (e) { next(e); }
});

router.delete("/account", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { confirm } = req.body as { confirm?: string };
    if (confirm !== "DELETE") throw badRequest("Confirmation required");
    // delete uploaded files
    const docs = await prisma.document.findMany({ where: { userId: user.id } });
    for (const d of docs) {
      const fp = `${env.UPLOAD_DIR}/${d.storageKey}`;
      try { if (require("fs").existsSync(fp)) require("fs").unlinkSync(fp); } catch {}
    }
    await prisma.user.delete({ where: { id: user.id } });
    res.clearCookie("sid", { path: "/" });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
