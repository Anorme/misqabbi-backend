import env from "../config/env.js";
import { Resend } from "resend";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

let resend;

if (!env.RESEND_API_KEY) {
  logger.warn("[emailService] Missing Resend API key");
}

try {
  resend = new Resend(env.RESEND_API_KEY);
  logger.info("Resend client is ready");
} catch (error) {
  logger.error(
    `[emailService] Resend client creation failed: ${error.message}`
  );
}

export const sendEmail = async (to, subject, text) => {
  if (!resend) {
    logger.error("[emailService] Resend client is not initialized");
    return formatResponse({
      success: false,
      error: "Email service not available",
    });
  }

  try {
    const emailData = {
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
    };

    await resend.emails.send(emailData);
    logger.info(`[emailService] Email sent successfully to ${to}`);
    return formatResponse({ message: "Email sent successfully" });
  } catch (error) {
    logger.error(`[emailService] Error: ${error.message}`);
    return formatResponse({
      success: false,
      error: error.message,
    });
  }
};
