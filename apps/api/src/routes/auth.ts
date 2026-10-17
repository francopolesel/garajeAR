import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, createSession, destroySession, destroyAllUserSessions, generateToken, hashToken } from "../lib/auth.js";
import { badRequest, unauthorized, conflict } from "../lib/errors.js";
import { authMiddleware, AuthedRequest } from "../middleware/auth.js";
import { csrfIssue } from "../middleware/csrf.js";
import { env, isProd } from "../lib/env.js";
import { OAuth2Client } from "google-auth-library";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  locale: z.string().optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict("Email already registered");
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        locale: data.locale || "es",
      },
    });
    const token = await createSession(user.id);
    csrfIssue(res);
    res.cookie("sid", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.status(201).json({ data: { id: user.id, name: user.name, email: user.email, locale: user.locale } });
  } catch (e) { next(e); }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Invalid credentials");
    const ok = await verifyPassword(user.passwordHash, data.password);
    if (!ok) throw unauthorized("Invalid credentials");
    const token = await createSession(user.id);
    csrfIssue(res);
    res.cookie("sid", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.json({ data: { id: user.id, name: user.name, email: user.email, locale: user.locale } });
  } catch (e) { next(e); }
});

router.post("/logout", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    await destroySession(req.sessionToken);
    res.clearCookie("sid", { path: "/" });
    res.clearCookie("csrf", { path: "/" });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    res.json({ data: {
      id: user.id, name: user.name, email: user.email, locale: user.locale,
      currency: user.currency, distanceUnit: user.distanceUnit, volumeUnit: user.volumeUnit,
      timeZone: user.timeZone, theme: user.theme, createdAt: user.createdAt,
    } });
  } catch (e) { next(e); }
});

router.get("/csrf", (_req, res) => {
  const token = csrfIssue(res);
  res.json({ data: { csrfToken: token } });
});

const forgotSchema = z.object({ email: z.string().email() });

router.post("/forgot-password", async (req, res, next) => {
  try {
    const data = forgotSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    // always respond success
    if (user) {
      const raw = generateToken(32);
      const hash = hashToken(raw);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt } });
      // In dev, log the reset link. In prod, send email via SMTP.
      const resetUrl = `${env.WEB_ORIGIN}/reset-password?token=${raw}`;
      // eslint-disable-next-line no-console
      console.log(`[PASSWORD RESET] ${email} -> ${resetUrl}`);
      // Try SMTP if configured
      if (env.SMTP_HOST) {
        try {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: parseInt(env.SMTP_PORT || "1025", 10),
            secure: false,
            auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
          });
          await transporter.sendMail({
            from: env.EMAIL_FROM,
            to: email,
            subject: "Reset your GarajeAR password",
            text: `Reset your password: ${resetUrl}`,
            html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
          });
        } catch (e) {
          console.error("SMTP send failed", e);
        }
      }
    }
    res.json({ data: { ok: true, message: "If the email exists, a reset link has been sent." } });
  } catch (e) { next(e); }
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const data = resetSchema.parse(req.body);
    const hash = hashToken(data.token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw badRequest("Invalid or expired token");
    }
    const passwordHash = await hashPassword(data.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

// Google Sign-In
router.get("/google", async (_req, res, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
      return res.status(501).json({ error: { code: "NOT_CONFIGURED", message: "Google auth not configured" } });
    }
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    const state = generateToken(16);
    const nonce = generateToken(16);
    res.cookie("g_state", state, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 10 * 60 * 1000 });
    res.cookie("g_nonce", nonce, { httpOnly: true, secure: isProd, sameSite: "lax", maxAge: 10 * 60 * 1000 });
    const url = client.generateAuthUrl({ access_type: "offline", scope: ["openid", "email", "profile"], state, nonce, prompt: "select_account" });
    res.redirect(url);
  } catch (e) { next(e); }
});

router.get("/google/callback", async (req, res, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
      return res.status(501).json({ error: { code: "NOT_CONFIGURED", message: "Google auth not configured" } });
    }
    const { code, state } = req.query as Record<string, string>;
    const storedState = req.cookies?.g_state;
    if (!state || !storedState || state !== storedState) {
      throw badRequest("Invalid state");
    }
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) throw badRequest("Invalid token");
    if (payload.nonce && payload.nonce !== req.cookies?.g_nonce) throw badRequest("Invalid nonce");

    // find or create user
    let identity = await prisma.userIdentity.findUnique({ where: { provider_providerSub: { provider: "google", providerSub: payload.sub } } });
    let user;
    if (identity) {
      user = await prisma.user.findUnique({ where: { id: identity.userId } });
    } else {
      // try link by email
      const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
      if (existing) {
        // link
        await prisma.userIdentity.create({ data: { userId: existing.id, provider: "google", providerSub: payload.sub, email: payload.email } });
        user = existing;
      } else {
        user = await prisma.user.create({
          data: {
            name: payload.name || payload.email,
            email: payload.email.toLowerCase(),
            passwordHash: "",
            locale: "es",
          },
        });
        await prisma.userIdentity.create({ data: { userId: user.id, provider: "google", providerSub: payload.sub, email: payload.email } });
      }
    }
    if (!user) throw badRequest("User creation failed");
    const token = await createSession(user.id);
    csrfIssue(res);
    res.cookie("sid", token, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.clearCookie("g_state", { path: "/" });
    res.clearCookie("g_nonce", { path: "/" });
    res.redirect(`${env.WEB_ORIGIN}/app/dashboard`);
  } catch (e) { next(e); }
});

export default router;
