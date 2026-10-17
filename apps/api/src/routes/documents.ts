import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound, forbidden } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";
import { env, maxUploadSize } from "../lib/env.js";

const router = Router();
router.use(authMiddleware);

const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { vehicleId, category, expired } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (vehicleId) where.vehicleId = vehicleId;
    if (category) where.category = category;
    if (expired === "true") where.expirationDate = { lt: new Date() };
    const docs = await prisma.document.findMany({ where, include: { vehicle: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } });
    res.json({ data: docs });
  } catch (e) { next(e); }
});

router.post("/upload", upload.single("file"), async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const file = req.file;
    if (!file) throw badRequest("No file uploaded");
    const { vehicleId, category = "OTHER", name, issueDate, expirationDate, notes } = req.body as Record<string, string>;
    if (!vehicleId) throw badRequest("vehicleId required");
    const v = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId: user.id } });
    if (!v) throw notFound();
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        vehicleId,
        name: name || file.originalname,
        category,
        storageKey: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        issueDate: issueDate ? new Date(issueDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes: notes || null,
      },
    });
    res.status(201).json({ data: doc });
  } catch (e) { next(e); }
});

router.get("/:id/download", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!doc) throw notFound();
    const filePath = path.join(uploadDir, doc.storageKey);
    if (!fs.existsSync(filePath)) throw notFound("File missing");
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (e) { next(e); }
});

router.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const { name, category, issueDate, expirationDate, notes } = req.body as Record<string, string>;
    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(issueDate !== undefined ? { issueDate: issueDate ? new Date(issueDate) : null } : {}),
        ...(expirationDate !== undefined ? { expirationDate: expirationDate ? new Date(expirationDate) : null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!existing) throw notFound();
    const filePath = path.join(uploadDir, existing.storageKey);
    await prisma.document.delete({ where: { id: req.params.id } });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

export default router;
