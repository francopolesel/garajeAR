import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_SIZE: z.string().default("10485760"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@garajear.local"),
});

export const env = envSchema.parse(process.env);
export const isProd = env.NODE_ENV === "production";
export const maxUploadSize = parseInt(env.MAX_UPLOAD_SIZE, 10);
