import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
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
    cb(null, "veh_" + crypto.randomBytes(16).toString("hex") + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: maxUploadSize }, fileFilter: (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error("Unsupported file type"));
} });

const vehicleSchema = z.object({
  type: z.string(),
  name: z.string().min(1).max(100),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  modelYear: z.number().int().min(1900).max(2100),
  trim: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  engine: z.string().optional().nullable(),
  displacement: z.number().optional().nullable(),
  transmission: z.string().optional().nullable(),
  powertrain: z.string().optional().nullable(),
  bodyStyle: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  purchaseCurrency: z.string().optional().nullable(),
  currentOdometer: z.number().min(0).default(0),
  odometerUnit: z.string().default("KM"),
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function ownedVehicle(userId: string, id: string) {
  return prisma.vehicle.findFirst({ where: { id, userId } });
}

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { search, type, archived, sort } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId: user.id };
    if (archived === "true") where.archived = true;
    else where.archived = false;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: sort === "name" ? { name: "asc" } : { updatedAt: "desc" } });
    res.json({ data: vehicles });
  } catch (e) { next(e); }
});

router.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id, type: data.type, name: data.name, make: data.make, model: data.model, modelYear: data.modelYear,
        trim: data.trim ?? null, vin: data.vin ?? null, registrationNumber: data.registrationNumber ?? null,
        engine: data.engine ?? null, displacement: data.displacement ?? null, transmission: data.transmission ?? null,
        powertrain: data.powertrain ?? null, bodyStyle: data.bodyStyle ?? null, color: data.color ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null, purchasePrice: data.purchasePrice ?? null,
        purchaseCurrency: data.purchaseCurrency ?? null, currentOdometer: data.currentOdometer, odometerUnit: data.odometerUnit,
        photoUrl: data.photoUrl ?? null, notes: data.notes ?? null,
      },
    });
    if (data.currentOdometer > 0) {
      await prisma.odometerReading.create({ data: { userId: user.id, vehicleId: vehicle.id, value: data.currentOdometer, unit: data.odometerUnit, observedAt: new Date(), source: "initial" } });
    }
    res.status(201).json({ data: vehicle });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const vehicle = await ownedVehicle(user.id, req.params.id);
    if (!vehicle) throw notFound();
    res.json({ data: vehicle });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await ownedVehicle(user.id, req.params.id);
    if (!existing) throw notFound();
    const data = vehicleSchema.partial().parse(req.body);
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...("type" in data ? { type: data.type! } : {}),
        ...("name" in data ? { name: data.name! } : {}),
        ...("make" in data ? { make: data.make! } : {}),
        ...("model" in data ? { model: data.model! } : {}),
        ...("modelYear" in data ? { modelYear: data.modelYear! } : {}),
        ...("trim" in data ? { trim: data.trim ?? null } : {}),
        ...("vin" in data ? { vin: data.vin ?? null } : {}),
        ...("registrationNumber" in data ? { registrationNumber: data.registrationNumber ?? null } : {}),
        ...("engine" in data ? { engine: data.engine ?? null } : {}),
        ...("displacement" in data ? { displacement: data.displacement ?? null } : {}),
        ...("transmission" in data ? { transmission: data.transmission ?? null } : {}),
        ...("powertrain" in data ? { powertrain: data.powertrain ?? null } : {}),
        ...("bodyStyle" in data ? { bodyStyle: data.bodyStyle ?? null } : {}),
        ...("color" in data ? { color: data.color ?? null } : {}),
        ...("purchaseDate" in data ? { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null } : {}),
        ...("purchasePrice" in data ? { purchasePrice: data.purchasePrice ?? null } : {}),
        ...("purchaseCurrency" in data ? { purchaseCurrency: data.purchaseCurrency ?? null } : {}),
        ...("currentOdometer" in data ? { currentOdometer: data.currentOdometer! } : {}),
        ...("odometerUnit" in data ? { odometerUnit: data.odometerUnit! } : {}),
        ...("photoUrl" in data ? { photoUrl: data.photoUrl ?? null } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
      },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await ownedVehicle(user.id, req.params.id);
    if (!existing) throw notFound();
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.post("/:id/archive", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await ownedVehicle(user.id, req.params.id);
    if (!existing) throw notFound();
    const v = await prisma.vehicle.update({ where: { id: req.params.id }, data: { archived: true } });
    res.json({ data: v });
  } catch (e) { next(e); }
});

router.post("/:id/restore", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await ownedVehicle(user.id, req.params.id);
    if (!existing) throw notFound();
    const v = await prisma.vehicle.update({ where: { id: req.params.id }, data: { archived: false } });
    res.json({ data: v });
  } catch (e) { next(e); }
});

// Profile photo upload
router.post("/:id/photo", upload.single("photo"), async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const existing = await ownedVehicle(user.id, req.params.id);
    if (!existing) throw notFound();
    const file = req.file;
    if (!file) throw badRequest("No file uploaded");
    // remove old photo file if present
    if (existing.photoUrl) {
      const oldPath = path.join(uploadDir, path.basename(existing.photoUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const photoUrl = `/uploads/${file.filename}`;
    const updated = await prisma.vehicle.update({ where: { id: req.params.id }, data: { photoUrl } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

export default router;
