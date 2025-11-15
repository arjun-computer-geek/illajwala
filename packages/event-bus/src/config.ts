import { z } from 'zod';
import { loadEnv } from '@illajwala/utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NATS_URL: z.string().url().default('nats://localhost:4222'),
  NATS_MAX_RECONNECT_ATTEMPTS: z.coerce.number().int().min(0).max(100).default(10),
  NATS_RECONNECT_TIME_WAIT_MS: z.coerce.number().int().positive().default(2000),
  NATS_PUBLISH_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  NATS_SUBSCRIBE_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  NATS_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(3),
  NATS_RETRY_DELAY_MS: z.coerce.number().int().positive().default(1000),
});

const envData = loadEnv({
  schema: envSchema,
  runtimeEnv: process.env,
  dotenv: process.env.ENV_PATH ? { path: process.env.ENV_PATH } : true,
});

export const eventBusConfig = {
  url: envData.NATS_URL,
  maxReconnectAttempts: envData.NATS_MAX_RECONNECT_ATTEMPTS,
  reconnectTimeWait: envData.NATS_RECONNECT_TIME_WAIT_MS,
  publishTimeout: envData.NATS_PUBLISH_TIMEOUT_MS,
  subscribeTimeout: envData.NATS_SUBSCRIBE_TIMEOUT_MS,
  maxRetries: envData.NATS_MAX_RETRIES,
  retryDelay: envData.NATS_RETRY_DELAY_MS,
};

export type EventBusConfig = typeof eventBusConfig;
