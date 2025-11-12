import { config } from "dotenv";
import { z } from "zod";

config({ path: process.env.ENV_PATH ?? ".env" });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string()
    .url()
    .default("mongodb://127.0.0.1:27017/illajwala_dev"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET should be at least 16 characters long")
    .default("dev-secret-change-me-please"),
  JWT_EXPIRY: z.string().default("1d"),
  CLIENT_URL: z.string().url().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessages = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${errorMessages}`);
}

const envData = parsed.data;

if (
  envData.NODE_ENV === "production" &&
  (!process.env.MONGODB_URI || !process.env.JWT_SECRET)
) {
  throw new Error("MONGODB_URI and JWT_SECRET must be provided in production");
}

export const env = envData;
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";

