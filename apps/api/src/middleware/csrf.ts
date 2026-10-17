import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../lib/env.js";

export function csrfIssue(res: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrf", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return token;
}

export function csrfProtect(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  // Public auth bootstrap endpoints do not require a pre-existing CSRF token.
  const isAuthBootstrap = req.path.startsWith("/api/v1/auth/") && ["/login", "/register", "/forgot-password", "/reset-password"].some((p) => req.path.endsWith(p));
  if (!isAuthBootstrap) {
    const cookieToken = req.cookies?.csrf;
    const headerToken = req.headers["x-csrf-token"];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: { code: "CSRF_FAILED", message: "CSRF token missing or invalid" } });
    }
  }
  // origin check
  const origin = req.headers.origin;
  if (origin && origin !== env.WEB_ORIGIN) {
    return res.status(403).json({ error: { code: "ORIGIN_FAILED", message: "Invalid origin" } });
  }
  next();
}
