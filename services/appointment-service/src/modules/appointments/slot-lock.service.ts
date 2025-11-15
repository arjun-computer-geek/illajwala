import { redis } from '../../config/redis';
import type { Types } from 'mongoose';

const SLOT_LOCK_PREFIX = 'illajwala:appointment:slot';

const toRedisKey = (
  tenantId: string,
  doctorId: string,
  scheduledAt: Date,
  clinicId?: Types.ObjectId | null,
) => {
  const baseKey = `${SLOT_LOCK_PREFIX}:${tenantId}:${doctorId}:${scheduledAt.toISOString()}`;
  return clinicId ? `${baseKey}:clinic:${clinicId.toString()}` : baseKey;
};

export const acquireSlotLock = async (
  tenantId: string,
  doctorId: string,
  scheduledAt: Date,
  ttlSeconds: number,
  clinicId?: Types.ObjectId | null,
) => {
  const key = toRedisKey(tenantId, doctorId, scheduledAt, clinicId);
  const response = await redis.set(key, 'locked', {
    EX: ttlSeconds,
    NX: true,
  } as any);
  return response === 'OK';
};

export const releaseSlotLock = async (
  tenantId: string,
  doctorId: string,
  scheduledAt: Date,
  clinicId?: Types.ObjectId | null,
) => {
  const key = toRedisKey(tenantId, doctorId, scheduledAt, clinicId);
  await redis.del(key);
};
