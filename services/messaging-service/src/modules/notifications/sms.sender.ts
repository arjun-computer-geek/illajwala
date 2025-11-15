'use strict';

import type { Logger } from 'pino';
import type { ConsultationEvent } from '../types/consultation-event';
import { smsConfig } from '../../config/env';
import { buildConsultationContext, renderTemplate } from './template-engine';

const smsTemplates: Partial<Record<ConsultationEvent['type'], string>> = {
  'consultation.checked-in':
    "Hi {{patientName|there}}, you're checked in for your Illajwala visit with {{doctorShortName}} at {{scheduledTime}}.",
  'consultation.in-session':
    '{{patientName|there}}, {{doctorShortName}} is ready now. Join the call or head into the consultation room.',
  'consultation.completed':
    'Your consultation with {{doctorShortName}} is complete. Check email for notes and follow-ups.',
  'consultation.no-show':
    'We missed you at today’s visit. Reply to reschedule with {{doctorShortName}} whenever convenient.',
};

export const sendConsultationSms = async (event: ConsultationEvent, logger: Logger) => {
  const smsEnabled = event.notificationPreferences?.smsReminders ?? true;
  if (!smsEnabled) {
    logger.info(
      { eventType: event.type, patientId: event.patientId },
      'Patient opted out of SMS notifications',
    );
    return;
  }

  if (!smsConfig) {
    logger.info({ eventType: event.type }, 'SMS transport disabled; logging notification instead');
    return;
  }

  if (!event.patientPhone) {
    logger.warn({ event }, 'Skipped SMS notification because patientPhone is missing');
    return;
  }

  const template = smsTemplates[event.type];
  if (!template) {
    logger.warn({ eventType: event.type }, 'No SMS template registered for consultation event');
    return;
  }

  const context = buildConsultationContext(event);
  const message = renderTemplate(template, context);

  logger.info(
    {
      to: event.patientPhone,
      sender: smsConfig.sender,
      event: event.type,
      message,
    },
    'SMS notification dispatched (sandbox)',
  );
};
