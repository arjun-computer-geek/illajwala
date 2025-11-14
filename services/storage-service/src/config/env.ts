import { z } from 'zod';
import { loadEnv } from '@illajwala/utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4005),
  MONGODB_URI: z.string().url().default('mongodb://127.0.0.1:27017/illajwala'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET should be at least 16 characters long')
    .default('dev-secret-change-me-please'),
  JWT_EXPIRY: z.string().default('1d'),
  REFRESH_JWT_SECRET: z
    .string()
    .min(16, 'REFRESH_JWT_SECRET should be at least 16 characters long')
    .default('dev-refresh-secret-change-me'),
  REFRESH_JWT_EXPIRY: z.string().default('7d'),
  CLIENT_URL: z.string().url().optional(),
  CLIENT_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().url().default('redis://127.0.0.1:6379'),
  // Cloudflare R2 Configuration
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().default(''),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().default(''),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().default(''),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().default('illajwala-storage'),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().url().optional(),
  // File Upload Limits
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf'),
});

const envData = loadEnv({
  schema: envSchema,
  runtimeEnv: process.env,
  dotenv: process.env.ENV_PATH ? { path: process.env.ENV_PATH } : true,
});

if (envData.NODE_ENV === 'production' && (!process.env.MONGODB_URI || !process.env.JWT_SECRET)) {
  throw new Error('MONGODB_URI and JWT_SECRET must be provided in production');
}

export const env = envData;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

const parseOrigins = (raw?: string | null) =>
  raw
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const configuredOrigins =
  parseOrigins(env.CLIENT_ORIGINS) ?? (env.CLIENT_URL ? [env.CLIENT_URL] : undefined);

export const clientOrigins =
  configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;

// Parse allowed file types
export const allowedFileTypes = env.ALLOWED_FILE_TYPES.split(',').map((type) => type.trim());
