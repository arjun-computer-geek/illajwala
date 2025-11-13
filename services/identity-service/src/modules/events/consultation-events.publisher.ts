import { Queue } from "bullmq";
import type { ConsultationEvent, ConsultationEventType } from "@illajwala/types";
import { redis } from "../../config/redis";

const consultationQueue = new Queue<ConsultationEvent>("consultation-events", {
  connection: redis,
});

type PublishConsultationEventInput = {
  type: ConsultationEventType;
  appointmentId: string;
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  scheduledAt: string;
  metadata?: Record<string, unknown>;
};

export const publishConsultationEvent = async (payload: PublishConsultationEventInput) => {
  await consultationQueue.add(payload.type, payload, {
    removeOnComplete: 100,
    removeOnFail: 25,
  });
};


