import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", (error) => {
  console.error("[redis] connection error", error);
});

export const connectRedis = async () => {
  if (redis.status === "ready" || redis.status === "connecting") {
    return;
  }
  await redis.connect();
  console.info("✅ Redis connected");
};

export const disconnectRedis = async () => {
  if (redis.status === "end" || redis.status === "close") {
    return;
  }
  await redis.quit();
};


