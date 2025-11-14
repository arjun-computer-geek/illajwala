"use strict";

import type { Logger } from "pino";
import type { WaitlistEvent } from "../types/waitlist-event";
import { env, smsConfig, whatsappConfig } from "../../config/env";
import { sendMail } from "./mailer";
import type { PatientNotificationPreferences } from "@illajwala/types";

const DEFAULT_WAITLIST_PREFERENCES: PatientNotificationPreferences = {
  emailReminders: true,
  smsReminders: true,
  whatsappReminders: false,
  waitlistReminders: true,
};

const resolvePreferences = (event: WaitlistEvent) => ({
  ...DEFAULT_WAITLIST_PREFERENCES,
  ...(event.notificationPreferences ?? {}),
});

const clinicLabel = (event: WaitlistEvent) =>
  event.clinicName ?? (event.clinicId ? `clinic ${event.clinicId}` : "the clinic");

const patientGreeting = (event: WaitlistEvent) => event.patientName ?? "there";

const locale = env.DEFAULT_LOCALE ?? "en";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (_error) {
    return null;
  }
};

type EmailMessage = {
  subject: string;
  text: string;
  html: string;
};

const buildEmailMessage = (event: WaitlistEvent): EmailMessage | null => {
  const greetingName = patientGreeting(event);
  const clinic = clinicLabel(event);

  switch (event.type) {
    case "waitlist.joined": {
      const baseText = `Hi ${greetingName}, we've added you to the waitlist for ${clinic}. We'll notify you as soon as a spot opens up.`;

      const preferencesText =
        event.requestedWindow && (event.requestedWindow.start || event.requestedWindow.end)
          ? (() => {
              const start = event.requestedWindow?.start ? formatDateTime(event.requestedWindow.start) : null;
              const end = event.requestedWindow?.end ? formatDateTime(event.requestedWindow.end) : null;
              if (start && end) {
                return ` You asked for availability between ${start} and ${end}.`;
              }
              if (start) {
                return ` You asked for availability after ${start}.`;
              }
              if (end) {
                return ` You asked for availability before ${end}.`;
              }
              return "";
            })()
          : "";

      const metadataNotes =
        event.requestedWindow?.notes && event.requestedWindow.notes.trim().length > 0
          ? ` Notes from your request: "${event.requestedWindow.notes.trim()}".`
          : "";

      const text = `${baseText}${preferencesText}${metadataNotes}`;
      const html = `<p>Hi ${greetingName},</p><p>We've added you to the waitlist for <strong>${clinic}</strong>. We'll notify you as soon as a spot opens up.</p>${
        preferencesText ? `<p>${preferencesText.trim()}</p>` : ""
      }${metadataNotes ? `<p>${metadataNotes.trim()}</p>` : ""}<p>Thank you for your patience.</p>`;

      return {
        subject: "You're on the waitlist",
        text,
        html,
      };
    }
    case "waitlist.invited": {
      const respondBy = formatDateTime(event.respondBy ?? null);
      const respondCopy = respondBy
        ? `Please confirm by ${respondBy} to secure the spot.`
        : "Please confirm soon to secure the spot.";

      const text = `Hi ${greetingName}, a visit slot is available at ${clinic}. ${respondCopy}`;
      const html = `<p>Hi ${greetingName},</p><p>Good news! A visit slot just opened up at <strong>${clinic}</strong>.</p><p>${respondCopy}</p>`;

      return {
        subject: "A spot just opened up",
        text,
        html,
      };
    }
    case "waitlist.promoted": {
      const text = `Hi ${greetingName}, your waitlist entry at ${clinic} has been promoted. Appointment reference: ${event.appointmentId}. We'll follow up with the full schedule shortly.`;
      const html = `<p>Hi ${greetingName},</p><p>Great news! Your waitlist entry at <strong>${clinic}</strong> has been promoted.</p><p>Your appointment reference is <strong>${event.appointmentId}</strong>. We'll follow up with the full schedule shortly.</p>`;

      return {
        subject: "Your waitlist spot is confirmed",
        text,
        html,
      };
    }
    case "waitlist.expired": {
      const text = `Hi ${greetingName}, we didn't hear back in time, so your waitlist entry for ${clinic} has expired. Rejoin from the app or contact support if you'd still like to be seen.`;
      const html = `<p>Hi ${greetingName},</p><p>We didn't hear back in time, so your waitlist entry for <strong>${clinic}</strong> has expired.</p><p>You can rejoin from the app or contact support if you'd still like to be seen.</p>`;

      return {
        subject: "Your waitlist window expired",
        text,
        html,
      };
    }
    case "waitlist.cancelled": {
      const reason = event.reason ? ` Reason: ${event.reason}.` : "";
      const text = `Hi ${greetingName}, your waitlist entry for ${clinic} was cancelled.${reason}`;
      const html = `<p>Hi ${greetingName},</p><p>Your waitlist entry for <strong>${clinic}</strong> was cancelled.${reason ? `<br />${reason}` : ""}</p>`;

      return {
        subject: "Your waitlist entry was cancelled",
        text,
        html,
      };
    }
    default:
      return null;
  }
};

const buildSmsMessage = (event: WaitlistEvent): string | null => {
  const greetingName = patientGreeting(event);
  const clinic = clinicLabel(event);

  switch (event.type) {
    case "waitlist.joined":
      return `Hi ${greetingName}, you're on the waitlist for ${clinic}. We'll ping you when a spot opens.`;
    case "waitlist.invited": {
      const respondBy = formatDateTime(event.respondBy ?? null);
      const respondCopy = respondBy ? ` Confirm by ${respondBy}.` : "";
      return `Hi ${greetingName}, a spot at ${clinic} is available.${respondCopy}`;
    }
    case "waitlist.promoted":
      return `Hi ${greetingName}, your waitlist spot at ${clinic} is confirmed! Check your email for appointment details.`;
    case "waitlist.expired":
      return `Hi ${greetingName}, your waitlist entry for ${clinic} expired. Rejoin anytime if you still need the visit.`;
    case "waitlist.cancelled": {
      const reason = event.reason ? ` Reason: ${event.reason}` : "";
      return `Hi ${greetingName}, your waitlist entry for ${clinic} was cancelled.${reason}`;
    }
    default:
      return null;
  }
};

export const sendWaitlistEmail = async (event: WaitlistEvent, logger: Logger) => {
  const preferences = resolvePreferences(event);

  if (!preferences.waitlistReminders || !preferences.emailReminders) {
    logger.info(
      { eventType: event.type, patientId: event.patientId },
      "Skipped waitlist email due to notification preferences"
    );
    return;
  }

  if (!event.patientEmail) {
    logger.warn({ eventType: event.type, patientId: event.patientId }, "Skipped waitlist email because patientEmail is missing");
    return;
  }

  const message = buildEmailMessage(event);
  if (!message) {
    logger.warn({ eventType: event.type }, "No email template registered for waitlist event");
    return;
  }

  await sendMail(logger, {
    to: event.patientEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

export const sendWaitlistSms = async (event: WaitlistEvent, logger: Logger) => {
  const preferences = resolvePreferences(event);

  if (!preferences.waitlistReminders || !preferences.smsReminders) {
    logger.info(
      { eventType: event.type, patientId: event.patientId },
      "Skipped waitlist SMS due to notification preferences"
    );
    return;
  }

  if (!smsConfig) {
    logger.info({ eventType: event.type }, "SMS transport disabled; logging waitlist notification instead");
    return;
  }

  if (!event.patientPhone) {
    logger.warn({ eventType: event.type, patientId: event.patientId }, "Skipped waitlist SMS because patientPhone is missing");
    return;
  }

  const message = buildSmsMessage(event);
  if (!message) {
    logger.warn({ eventType: event.type }, "No SMS template registered for waitlist event");
    return;
  }

  logger.info(
    {
      to: event.patientPhone,
      sender: smsConfig.sender,
      event: event.type,
      message,
    },
    "Waitlist SMS dispatched (sandbox)"
  );
};

export const sendWaitlistWhatsapp = async (event: WaitlistEvent, logger: Logger) => {
  const preferences = resolvePreferences(event);

  if (!preferences.waitlistReminders || !preferences.whatsappReminders) {
    logger.info(
      { eventType: event.type, patientId: event.patientId },
      "Skipped waitlist WhatsApp due to notification preferences"
    );
    return;
  }

  if (!whatsappConfig) {
    logger.info({ eventType: event.type }, "WhatsApp transport disabled; logging waitlist notification instead");
    return;
  }

  if (!event.patientPhone) {
    logger.warn(
      { eventType: event.type, patientId: event.patientId },
      "Skipped waitlist WhatsApp because patientPhone is missing"
    );
    return;
  }

  const message = buildSmsMessage(event);
  if (!message) {
    logger.warn({ eventType: event.type }, "No WhatsApp template registered for waitlist event");
    return;
  }

  logger.info(
    {
      to: event.patientPhone,
      businessNumber: whatsappConfig.businessNumber,
      event: event.type,
      message,
    },
    "Waitlist WhatsApp dispatched (sandbox)"
  );
};


