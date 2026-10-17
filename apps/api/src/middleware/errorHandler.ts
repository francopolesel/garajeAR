import { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  const e = err as Error;
  logger.error({ err: e?.message, stack: e?.stack }, "unhandled error");
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}
