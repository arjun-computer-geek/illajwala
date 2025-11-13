import { redis } from "../../config/redis";

const SLOT_LOCK_PREFIX = "illajwala:appointment:slot";

const toRedisKey = (tenantId: string, doctorId: string, scheduledAt: Date) =>
  `${SLOT_LOCK_PREFIX}:${tenantId}:${doctorId}:${scheduledAt.toISOString()}`;

export const acquireSlotLock = async (
  tenantId: string,
  doctorId: string,
  scheduledAt: Date,
  ttlSeconds: number
) => {
  const key = toRedisKey(tenantId, doctorId, scheduledAt);
  const response = await redis.set(
    key,
    "locked",
    {
      EX: ttlSeconds,
      NX: true,
    } as any
  );
  return response === "OK";
};

export const releaseSlotLock = async (tenantId: string, doctorId: string, scheduledAt: Date) => {
  const key = toRedisKey(tenantId, doctorId, scheduledAt);
  await redis.del(key);
};

