import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env, isProd } from "./lib/env.js";

import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { csrfProtect } from "./middleware/csrf.js";
import { authMiddleware } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import vehiclesRouter from "./routes/vehicles.js";
import maintenanceRouter from "./routes/maintenance.js";
import energyRouter from "./routes/energy.js";
import expensesRouter from "./routes/expenses.js";
import remindersRouter from "./routes/reminders.js";
import documentsRouter from "./routes/documents.js";
import usersRouter from "./routes/users.js";
import reportsRouter from "./routes/reports.js";
import inspectionsRouter from "./routes/inspections.js";
import financeRouter from "./routes/finance.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(pinoHttp({ logger }));
  app.use(cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "Authorization"],
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/uploads", express.static(env.UPLOAD_DIR));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);
  app.use("/api/v1/auth/forgot-password", authLimiter);

  app.use(csrfProtect);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/vehicles", vehiclesRouter);
  app.use("/api/v1", maintenanceRouter);
  app.use("/api/v1", energyRouter);
  app.use("/api/v1/expenses", expensesRouter);
  app.use("/api/v1/reminders", remindersRouter);
  app.use("/api/v1/documents", documentsRouter);
  app.use("/api/v1", usersRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1", inspectionsRouter);
  app.use("/api/v1/finance", financeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
