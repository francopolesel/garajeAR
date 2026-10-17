import { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../lib/auth.js";
import { unauthorized } from "../lib/errors.js";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; name: string; locale: string; currency: string; distanceUnit: string; volumeUnit: string; timeZone: string; theme: string };
  sessionToken?: string;
}

export async function authMiddleware(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.sid;
    const user = await getSessionUser(token);
    if (!user) return next(unauthorized());
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      currency: user.currency,
      distanceUnit: user.distanceUnit,
      volumeUnit: user.volumeUnit,
      timeZone: user.timeZone,
      theme: user.theme,
    };
    req.sessionToken = token;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireUser(req: AuthedRequest) {
  if (!req.user) throw unauthorized();
  return req.user;
}
