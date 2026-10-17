import crypto from "crypto";
import argon2 from "argon2";
import { prisma } from "./prisma.js";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const raw = generateToken(48);
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await prisma.session.create({ data: { userId, tokenHash: hash, expiresAt } });
  return raw;
}

export async function getSessionUser(rawToken: string | undefined) {
  if (!rawToken) return null;
  const hash = hashToken(rawToken);
  const session = await prisma.session.findUnique({ where: { tokenHash: hash }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function destroySession(rawToken: string | undefined) {
  if (!rawToken) return;
  const hash = hashToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash: hash } });
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
