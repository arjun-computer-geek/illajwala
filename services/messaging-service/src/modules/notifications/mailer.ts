import nodemailer from "nodemailer";
import type { Logger } from "pino";
import { emailConfig } from "../../config/env";

type Transporter = ReturnType<typeof nodemailer.createTransport> | null;

let transporter: Transporter = null;

export const getMailer = (logger: Logger): Transporter => {
  if (transporter !== null) {
    return transporter;
  }

  if (!emailConfig) {
    logger.warn({ msg: "SMTP configuration missing; falling back to console log notifications." });
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  });

  return transporter;
};

export const sendMail = async (
  logger: Logger,
  options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }
) => {
  const mailer = getMailer(logger);

  if (!mailer || !emailConfig) {
    logger.info({ to: options.to, subject: options.subject }, "Email transport disabled; logged notification instead");
    return;
  }

  await mailer.sendMail({
    from: emailConfig.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
};


