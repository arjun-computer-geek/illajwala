import type { ConsultationEvent } from "../types/consultation-event";
import type { Logger } from "pino";
import { sendMail } from "./mailer";
import { buildConsultationContext, renderTemplate } from "./template-engine";

const statusCopy: Record<ConsultationEvent["type"], { subject: string; headline: string; intro: string }> = {
  "consultation.checked-in": {
    subject: "You're checked in for your Illajwala consultation",
    headline: "You're checked in!",
    intro:
      "Hi {{patientName|there}}, you're all set for your consultation with {{doctorShortName}}. We'll keep the clinic updated while you make your way.",
  },
  "consultation.in-session": {
    subject: "Your consultation with {{doctorShortName}} is starting now",
    headline: "Your consultation is in session",
    intro:
      "Hi {{patientName|there}}, {{doctorShortName}} is ready for you now. Join the telehealth room or step into the consultation space to get started.",
  },
  "consultation.completed": {
    subject: "Consultation summary & next steps with {{doctorShortName}}",
    headline: "Your consultation is complete",
    intro:
      "Hi {{patientName|there}}, thanks for meeting with {{doctorShortName}}. We've captured the visit summary and follow-ups for your records.",
  },
  "consultation.no-show": {
    subject: "We missed you at your Illajwala consultation",
    headline: "We missed you",
    intro:
      "Hi {{patientName|there}}, we noticed you couldn't make it today. Reach out to the clinic whenever you're ready to rebook or if you need assistance.",
  },
};

const renderFollowUpList = (followUps: string[]): string => {
  if (!Array.isArray(followUps) || followUps.length === 0) {
    return "<p>No specific follow-ups were recorded.</p>";
  }
  const items = followUps
    .map((text) => `<li>${text}</li>`)
    .join("");
  return `<ul style="padding-left:16px;margin:8px 0;">${items}</ul>`;
};

export const sendConsultationEmail = async (event: ConsultationEvent, logger: Logger) => {
  if (!event.patientEmail) {
    logger.warn({ event }, "Skipped email notification because patientEmail is missing");
    return;
  }

  const emailEnabled = event.notificationPreferences?.emailReminders ?? true;
  if (!emailEnabled) {
    logger.info({ eventType: event.type, patientId: event.patientId }, "Patient opted out of email notifications");
    return;
  }

  const copy = statusCopy[event.type];
  const context = buildConsultationContext(event);
  const followUpActions = context.followUpActions;
  const notes = context.notes;
  const intro = renderTemplate(copy.intro, context);
  const subject = renderTemplate(copy.subject, context);
  const headline = renderTemplate(copy.headline, context);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>${headline}</h2>
      <p>${intro}</p>
      <p><strong>Scheduled:</strong> ${context.scheduledTime}</p>
      ${
        notes
          ? `<div style="margin-top:16px;">
              <h3 style="margin-bottom:4px;">Visit summary</h3>
              <p style="white-space:pre-wrap;">${notes}</p>
            </div>`
          : ""
      }
      <div style="margin-top:16px;">
        <h3 style="margin-bottom:4px;">Next steps</h3>
        ${renderFollowUpList(followUpActions)}
      </div>
      <p style="margin-top:24px;">If you have any questions, reply to this email and the clinic team will assist you.</p>
      <p>— The Illajwala Care Team</p>
    </div>
  `;

  const text = [
    headline,
    renderTemplate("Hi {{patientName|there}},", context),
    intro,
    `Scheduled: ${context.scheduledTime}`,
    notes ? `Visit summary: ${notes}` : null,
    Array.isArray(followUpActions) && followUpActions.length > 0
      ? `Follow-up actions:\n${followUpActions.map((item) => `• ${item}`).join("\n")}`
      : "No specific follow-ups were recorded.",
    "",
    "If you have questions, reply to this email and the clinic team will assist you.",
    "— The Illajwala Care Team",
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendMail(logger, {
    to: event.patientEmail,
    subject,
    html,
    text,
  });
};



