import type { ConsultationEvent, ConsultationEventType } from '@illajwala/types';
import { createEventPublisher } from '@illajwala/event-bus';

// Create a singleton event publisher instance
let eventPublisher: ReturnType<typeof createEventPublisher> | null = null;

const getEventPublisher = async () => {
  if (!eventPublisher) {
    eventPublisher = createEventPublisher();
    await eventPublisher.connect();
  }
  return eventPublisher;
};

type PublishConsultationEventInput = {
  type: ConsultationEventType;
  tenantId: string;
  appointmentId: string;
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  scheduledAt: string;
  metadata?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
};

export const publishConsultationEvent = async (payload: PublishConsultationEventInput) => {
  const publisher = await getEventPublisher();

  const event: ConsultationEvent = {
    type: payload.type,
    tenantId: payload.tenantId,
    appointmentId: payload.appointmentId,
    doctorId: payload.doctorId,
    doctorName: payload.doctorName,
    patientId: payload.patientId,
    patientName: payload.patientName,
    patientEmail: payload.patientEmail,
    patientPhone: payload.patientPhone,
    scheduledAt: payload.scheduledAt,
    metadata: payload.metadata,
    notificationPreferences: payload.notificationPreferences as any,
  };

  await publisher.publish(event);
};

// Graceful shutdown
export const disconnectEventPublisher = async () => {
  if (eventPublisher) {
    await eventPublisher.disconnect();
    eventPublisher = null;
  }
};
