import { redis } from "../../config/redis";

const SLOT_LOCK_PREFIX = "illajwala:appointment:slot";

const toRedisKey = (doctorId: string, scheduledAt: Date) =>
  `${SLOT_LOCK_PREFIX}:${doctorId}:${scheduledAt.toISOString()}`;

export const acquireSlotLock = async (doctorId: string, scheduledAt: Date, ttlSeconds: number) => {
  const key = toRedisKey(doctorId, scheduledAt);
  const response = await redis.set(key, "locked", "NX", "EX", ttlSeconds);
  return response === "OK";
};

export const releaseSlotLock = async (doctorId: string, scheduledAt: Date) => {
  const key = toRedisKey(doctorId, scheduledAt);
  await redis.del(key);
};


