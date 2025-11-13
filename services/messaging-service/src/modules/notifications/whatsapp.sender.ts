"use strict";

import type { Logger } from "pino";
import type { ConsultationEvent } from "../types/consultation-event";
import { whatsappConfig } from "../../config/env";
import { buildConsultationContext, renderTemplate } from "./template-engine";

const whatsappTemplates: Record<ConsultationEvent["type"], string> = {
  "consultation.checked-in":
    "Hi {{patientName|there}}, you’re checked in for your Illajwala consultation with {{doctorShortName}}. We’ll see you shortly at {{scheduledTime}}.",
  "consultation.in-session":
    "{{patientName|there}}, {{doctorShortName}} is ready now. Tap the join link from your email/SMS to start the session.",
  "consultation.completed":
    "Your visit with {{doctorShortName}} is complete. Review notes and next steps in your email or patient account.",
  "consultation.no-show":
    "Looks like we missed you today. Reply here and the clinic team will help you reschedule with {{doctorShortName}}.",
};

export const sendConsultationWhatsapp = async (event: ConsultationEvent, logger: Logger) => {
  const whatsappEnabled = event.notificationPreferences?.whatsappReminders ?? false;
  if (!whatsappEnabled) {
    logger.info(
      { eventType: event.type, patientId: event.patientId },
      "Patient opted out of WhatsApp notifications"
    );
    return;
  }

  if (!whatsappConfig) {
    logger.info({ eventType: event.type }, "WhatsApp transport disabled; logging notification instead");
    return;
  }

  if (!event.patientPhone) {
    logger.warn({ event }, "Skipped WhatsApp notification because patientPhone is missing");
    return;
  }

  const template = whatsappTemplates[event.type];
  if (!template) {
    logger.warn({ eventType: event.type }, "No WhatsApp template registered for consultation event");
    return;
  }

  const context = buildConsultationContext(event);
  const message = renderTemplate(template, context);

  logger.info(
    {
      to: event.patientPhone,
      businessNumber: whatsappConfig.businessNumber,
      event: event.type,
      message,
    },
    "WhatsApp notification dispatched (sandbox)"
  );
};


