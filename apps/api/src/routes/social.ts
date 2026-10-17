import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound, forbidden } from "../lib/errors.js";
import { authMiddleware, AuthedRequest, requireUser } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { env, maxUploadSize } from "../lib/env.js";

const router = Router();
router.use(authMiddleware);

function pairKey(a: string, b: string) { return [a, b].sort().join(":"); }

function isBlocked(a: string, b: string) {
  return prisma.userBlock.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });
}

// ---- Profile ----
router.get("/users/search", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const q = String(req.query.q || "").trim();
    if (!q) { res.json({ data: [] }); return; }
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
        profileVisibility: { not: "PRIVATE" },
      },
      select: { id: true, username: true, displayName: true, name: true, bio: true, avatarUrl: true },
      take: 20,
    });
    // filter blocked
    const blocks = await prisma.userBlock.findMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } });
    const blockedIds = new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId]));
    const filtered = users.filter((u) => !blockedIds.has(u.id));
    res.json({ data: filtered });
  } catch (e) { next(e); }
});

router.get("/users/:username", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const target = await prisma.user.findUnique({ where: { username: req.params.username }, select: { id: true, username: true, displayName: true, name: true, bio: true, avatarUrl: true, createdAt: true, profileVisibility: true } });
    if (!target || target.profileVisibility === "PRIVATE") throw notFound();
    const blocked = await isBlocked(user.id, target.id);
    if (blocked) throw notFound();
    res.json({ data: target });
  } catch (e) { next(e); }
});

router.patch("/profile", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const schema = z.object({
      username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
      displayName: z.string().max(60).optional(),
      bio: z.string().max(200).optional(),
      profileVisibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
      friendRequestPermission: z.enum(["EVERYONE", "FRIENDS_OF_FRIENDS", "NOBODY"]).optional(),
      onlineVisibility: z.enum(["EVERYONE", "FRIENDS", "NOBODY"]).optional(),
      lastSeenVisibility: z.enum(["EVERYONE", "FRIENDS", "NOBODY"]).optional(),
      readReceipts: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    if (data.username) {
      const normalized = data.username.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { username: normalized } });
      if (existing && existing.id !== user.id) throw badRequest("Username taken");
      data.username = normalized;
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    res.json({ data: { id: updated.id, username: updated.username, displayName: updated.displayName, bio: updated.bio, avatarUrl: updated.avatarUrl, profileVisibility: updated.profileVisibility } });
  } catch (e) { next(e); }
});

// avatar upload
const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, "avatar_" + crypto.randomBytes(16).toString("hex") + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({ storage, limits: { fileSize: maxUploadSize }, fileFilter: (_req, file, cb) => {
  if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true); else cb(new Error("Unsupported"));
} });

router.post("/profile/avatar", upload.single("avatar"), async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const file = req.file;
    if (!file) throw badRequest("No file");
    const avatarUrl = `/uploads/${file.filename}`;
    const updated = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
    res.json({ data: { avatarUrl: updated.avatarUrl } });
  } catch (e) { next(e); }
});

// ---- Friend requests ----
router.get("/friends", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const friendships = await prisma.friendship.findMany({ where: { OR: [{ userAId: user.id }, { userBId: user.id }] } });
    const friendIds = friendships.map((f) => f.userAId === user.id ? f.userBId : f.userAId);
    const friends = await prisma.user.findMany({ where: { id: { in: friendIds } }, select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, bio: true } });
    res.json({ data: friends });
  } catch (e) { next(e); }
});

router.get("/friends/requests/incoming", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const reqs = await prisma.friendRequest.findMany({ where: { recipientId: user.id, status: "PENDING" }, include: { sender: { select: { id: true, username: true, displayName: true, name: true, avatarUrl: true } } } });
    res.json({ data: reqs });
  } catch (e) { next(e); }
});

router.get("/friends/requests/outgoing", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const reqs = await prisma.friendRequest.findMany({ where: { senderId: user.id, status: "PENDING" }, include: { recipient: { select: { id: true, username: true, displayName: true, name: true, avatarUrl: true } } } });
    res.json({ data: reqs });
  } catch (e) { next(e); }
});

router.post("/friends/requests", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { recipientId } = z.object({ recipientId: z.string() }).parse(req.body);
    if (recipientId === user.id) throw badRequest("Cannot request yourself");
    const blocked = await isBlocked(user.id, recipientId);
    if (blocked) throw forbidden("Blocked");
    const existing = await prisma.friendship.findUnique({ where: { pairKey: pairKey(user.id, recipientId) } });
    if (existing) throw badRequest("Already friends");
    const pending = await prisma.friendRequest.findFirst({ where: { pairKey: pairKey(user.id, recipientId), status: "PENDING" } });
    if (pending) throw badRequest("Request already pending");
    const fr = await prisma.friendRequest.create({ data: { senderId: user.id, recipientId, pairKey: pairKey(user.id, recipientId) } });
    // notification
    await prisma.socialNotification.create({ data: { userId: recipientId, type: "FRIEND_REQUEST", title: "Nueva solicitud de amistad", body: `${user.displayName || user.name} te envió una solicitud` } });
    res.status(201).json({ data: fr });
  } catch (e) { next(e); }
});

router.post("/friends/requests/:id/accept", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const fr = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!fr || fr.recipientId !== user.id || fr.status !== "PENDING") throw notFound();
    await prisma.$transaction(async (tx: any) => {
      await tx.friendRequest.update({ where: { id: fr.id }, data: { status: "ACCEPTED", decidedAt: new Date() } });
      await tx.friendship.create({ data: { userAId: fr.senderId, userBId: fr.recipientId, pairKey: fr.pairKey } });
      await tx.socialNotification.create({ data: { userId: fr.senderId, type: "FRIEND_ACCEPTED", title: "Solicitud aceptada", body: `${user.displayName || user.name} aceptó tu solicitud` } });
    });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.post("/friends/requests/:id/reject", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const fr = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!fr || fr.recipientId !== user.id || fr.status !== "PENDING") throw notFound();
    await prisma.friendRequest.update({ where: { id: fr.id }, data: { status: "REJECTED", decidedAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.delete("/friends/requests/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const fr = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!fr || (fr.senderId !== user.id && fr.recipientId !== user.id) || fr.status !== "PENDING") throw notFound();
    await prisma.friendRequest.update({ where: { id: fr.id }, data: { status: "CANCELLED", decidedAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.delete("/friends/:userId", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const pk = pairKey(user.id, req.params.userId);
    await prisma.friendship.deleteMany({ where: { pairKey: pk } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

// ---- Blocks ----
router.post("/blocks", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    if (userId === user.id) throw badRequest("Cannot block yourself");
    await prisma.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } }, update: {}, create: { blockerId: user.id, blockedId: userId } });
    // remove friendship
    await prisma.friendship.deleteMany({ where: { pairKey: pairKey(user.id, userId) } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.delete("/blocks/:userId", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    await prisma.userBlock.deleteMany({ where: { blockerId: user.id, blockedId: req.params.userId } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.get("/blocks", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const blocks = await prisma.userBlock.findMany({ where: { blockerId: user.id }, include: { blocked: { select: { id: true, username: true, displayName: true, name: true, avatarUrl: true } } } });
    res.json({ data: blocks });
  } catch (e) { next(e); }
});

// ---- Conversations ----
router.get("/conversations", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const memberships = await prisma.conversationMember.findMany({ where: { userId: user.id }, include: { conversation: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } } } });
    const convs = memberships.map((m: any) => ({ ...m.conversation, member: m }));
    res.json({ data: convs });
  } catch (e) { next(e); }
});

router.post("/conversations/direct", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { userId: otherId } = z.object({ userId: z.string() }).parse(req.body);
    if (otherId === user.id) throw badRequest("Cannot chat with yourself");
    const blocked = await isBlocked(user.id, otherId);
    if (blocked) throw forbidden("Blocked");
    const pk = pairKey(user.id, otherId);
    let conv = await prisma.conversation.findUnique({ where: { pairKey: pk } });
    if (!conv) {
      conv = await prisma.conversation.create({ data: { type: "DIRECT", pairKey: pk, members: { create: [{ userId: user.id }, { userId: otherId }] } } });
    }
    res.json({ data: conv });
  } catch (e) { next(e); }
});

router.get("/conversations/:id/messages", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: req.params.id, userId: user.id } } });
    if (!member) throw forbidden("Not a member");
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit || "30"), 10), 100);
    const msgs = await prisma.message.findMany({
      where: { conversationId: req.params.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { sender: { select: { id: true, username: true, displayName: true, name: true, avatarUrl: true } }, attachments: true, reactions: true, replyTo: { select: { id: true, text: true, senderId: true } } },
    });
    res.json({ data: msgs.reverse() });
  } catch (e) { next(e); }
});

router.post("/conversations/:id/messages", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: req.params.id, userId: user.id } } });
    if (!member) throw forbidden("Not a member");
    const schema = z.object({ text: z.string().max(5000).optional(), clientId: z.string().optional(), replyToId: z.string().optional(), type: z.string().default("TEXT") });
    const data = schema.parse(req.body);
    if (!data.text && data.type === "TEXT") throw badRequest("Empty message");
    // idempotency
    if (data.clientId) {
      const existing = await prisma.message.findUnique({ where: { conversationId_clientId: { conversationId: req.params.id, clientId: data.clientId } } });
      if (existing) { res.json({ data: existing }); return; }
    }
    const msg = await prisma.message.create({ data: { conversationId: req.params.id, senderId: user.id, type: data.type, text: data.text, clientId: data.clientId, replyToId: data.replyToId } });
    await prisma.conversation.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    const io = (global as any).__io;
    if (io) io.to(`conv:${req.params.id}`).emit("message:new", msg);
    // notify other members
    const members = await prisma.conversationMember.findMany({ where: { conversationId: req.params.id, userId: { not: user.id } } });
    for (const m of members) {
      await prisma.socialNotification.create({ data: { userId: m.userId, type: "NEW_MESSAGE", title: "Nuevo mensaje", body: (data.text || "").slice(0, 80) } });
      if (io) io.to(`user:${m.userId}`).emit("notification:new", { type: "NEW_MESSAGE" });
    }
    res.status(201).json({ data: msg });
  } catch (e) { next(e); }
});

router.patch("/messages/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const msg = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!msg || msg.senderId !== user.id) throw forbidden("Not owner");
    if (msg.deletedAt) throw badRequest("Deleted");
    const { text } = z.object({ text: z.string().max(5000) }).parse(req.body);
    const updated = await prisma.message.update({ where: { id: req.params.id }, data: { text, editedAt: new Date() } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/messages/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const msg = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!msg || msg.senderId !== user.id) throw forbidden("Not owner");
    const updated = await prisma.message.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), text: null } });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.post("/messages/:id/reactions", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const { emoji } = z.object({ emoji: z.string().max(8) }).parse(req.body);
    const msg = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!msg) throw notFound();
    const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: msg.conversationId, userId: user.id } } });
    if (!member) throw forbidden("Not a member");
    const reaction = await prisma.messageReaction.create({ data: { messageId: req.params.id, userId: user.id, emoji } });
    res.status(201).json({ data: reaction });
  } catch (e) { next(e); }
});

router.delete("/messages/:id/reactions/:emoji", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    await prisma.messageReaction.deleteMany({ where: { messageId: req.params.id, userId: user.id, emoji: req.params.emoji } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.post("/conversations/:id/read", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: req.params.id, userId: user.id } } });
    if (!member) throw forbidden("Not a member");
    await prisma.conversationMember.update({ where: { id: member.id }, data: { lastReadAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.patch("/conversations/:id", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: req.params.id, userId: user.id } } });
    if (!member) throw forbidden("Not a member");
    const data = z.object({ muted: z.boolean().optional(), archived: z.boolean().optional(), pinned: z.boolean().optional() }).parse(req.body);
    await prisma.conversationMember.update({ where: { id: member.id }, data });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

// ---- Notifications ----
router.get("/notifications", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const items = await prisma.socialNotification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ data: items });
  } catch (e) { next(e); }
});

router.post("/notifications/:id/read", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    await prisma.socialNotification.updateMany({ where: { id: req.params.id, userId: user.id }, data: { readAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.post("/notifications/read-all", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    await prisma.socialNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

// ---- Reports ----
router.post("/reports", async (req: AuthedRequest, res, next) => {
  try {
    const user = requireUser(req);
    const data = z.object({ reportedId: z.string().optional(), messageId: z.string().optional(), reason: z.string(), details: z.string().optional() }).parse(req.body);
    const r = await prisma.abuseReport.create({ data: { reporterId: user.id, reportedId: data.reportedId, messageId: data.messageId, reason: data.reason, details: data.details } });
    res.status(201).json({ data: r });
  } catch (e) { next(e); }
});

export default router;
