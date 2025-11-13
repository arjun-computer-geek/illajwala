import type { ConsultationEvent } from "../types/consultation-event";
import type { Logger } from "pino";
import { sendMail } from "./mailer";

const statusCopy: Record<ConsultationEvent["type"], { subject: string; headline: string }> = {
  "consultation.checked-in": {
    subject: "You're checked in for your Illajwala consultation",
    headline: "You're checked in!",
  },
  "consultation.in-session": {
    subject: "Your consultation is starting now",
    headline: "Your consultation is in session",
  },
  "consultation.completed": {
    subject: "Consultation summary & next steps",
    headline: "Your consultation is complete",
  },
  "consultation.no-show": {
    subject: "We missed you at your Illajwala consultation",
    headline: "We missed you",
  },
};

const renderFollowUpList = (followUps?: unknown): string => {
  if (!Array.isArray(followUps) || followUps.length === 0) {
    return "<p>No specific follow-ups were recorded.</p>";
  }
  const items = followUps
    .map((item) => String(item))
    .map((text) => `<li>${text}</li>`)
    .join("");
  return `<ul style="padding-left:16px;margin:8px 0;">${items}</ul>`;
};

export const sendConsultationEmail = async (event: ConsultationEvent, logger: Logger) => {
  if (!event.patientEmail) {
    logger.warn({ event }, "Skipped email notification because patientEmail is missing");
    return;
  }

  const copy = statusCopy[event.type];
  const followUpActions = event.metadata?.followUpActions;
  const notes = typeof event.metadata?.notes === "string" ? event.metadata?.notes : null;
  const scheduledDate = new Date(event.scheduledAt).toLocaleString();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>${copy.headline}</h2>
      <p>Hi ${event.patientName ?? "there"},</p>
      <p>Your appointment with Dr. ${event.doctorName ?? "Illajwala specialist"} is currently marked as <strong>${
        copy.headline
      }</strong>.</p>
      <p><strong>Scheduled:</strong> ${scheduledDate}</p>
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
    copy.headline,
    `Hi ${event.patientName ?? "there"},`,
    `Appointment status: ${copy.headline}`,
    `Scheduled: ${scheduledDate}`,
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
    subject: copy.subject,
    html,
    text,
  });
};



