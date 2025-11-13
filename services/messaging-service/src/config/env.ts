import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Load .env.* files before parsing. This keeps the development experience
// aligned with our other services.
loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 4200))
    .pipe(
      z
        .number()
        .min(1000, "PORT should be >= 1000")
        .max(65535, "PORT should be <= 65535")
    ),
  REDIS_URL: z.string().url("Provide REDIS_URL for BullMQ queues"),
  SERVICE_NAME: z.string().default("messaging-service"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);

export const emailConfig = (() => {
  if (!env.SMTP_HOST || !env.SMTP_FROM_EMAIL) {
    return null;
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
    from: env.SMTP_FROM_EMAIL,
  };
})();


