import { z } from 'zod';
import { loadEnv } from '@illajwala/utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APPOINTMENT_SERVICE_URL: z.string().url().default('http://localhost:4002'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:4003'),
  PROVIDER_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://localhost:4004'),
  STORAGE_SERVICE_URL: z.string().url().default('http://localhost:4005'),
  MESSAGING_SERVICE_URL: z.string().url().default('http://localhost:4006'),
  SERVICE_CLIENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  SERVICE_CLIENT_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(3),
  SERVICE_CLIENT_RETRY_DELAY_MS: z.coerce.number().int().positive().default(1000),
  SERVICE_CLIENT_CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().int().positive().default(5),
  SERVICE_CLIENT_CIRCUIT_BREAKER_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
});

const envData = loadEnv({
  schema: envSchema,
  runtimeEnv: process.env,
  dotenv: process.env.ENV_PATH ? { path: process.env.ENV_PATH } : true,
});

export const serviceConfig = {
  appointmentServiceUrl: envData.APPOINTMENT_SERVICE_URL,
  paymentServiceUrl: envData.PAYMENT_SERVICE_URL,
  providerServiceUrl: envData.PROVIDER_SERVICE_URL,
  analyticsServiceUrl: envData.ANALYTICS_SERVICE_URL,
  storageServiceUrl: envData.STORAGE_SERVICE_URL,
  messagingServiceUrl: envData.MESSAGING_SERVICE_URL,
  timeout: envData.SERVICE_CLIENT_TIMEOUT_MS,
  maxRetries: envData.SERVICE_CLIENT_MAX_RETRIES,
  retryDelay: envData.SERVICE_CLIENT_RETRY_DELAY_MS,
  circuitBreakerThreshold: envData.SERVICE_CLIENT_CIRCUIT_BREAKER_THRESHOLD,
  circuitBreakerTimeout: envData.SERVICE_CLIENT_CIRCUIT_BREAKER_TIMEOUT_MS,
};

export type ServiceConfig = typeof serviceConfig;
