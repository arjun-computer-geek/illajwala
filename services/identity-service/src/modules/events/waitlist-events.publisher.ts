import { Queue } from "bullmq";
import type { WaitlistEvent } from "@illajwala/types";
import { redis } from "../../config/redis";

const waitlistQueue = new Queue<WaitlistEvent>("waitlist-events", {
  connection: redis,
});

export const publishWaitlistEvent = async (payload: WaitlistEvent) => {
  await waitlistQueue.add(payload.type, payload, {
    removeOnComplete: 100,
    removeOnFail: 25,
  });
};

