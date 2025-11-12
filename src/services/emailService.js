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

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends an email with retry mechanism and exponential backoff
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns {Promise<Object>} Response object
 */
export const sendEmail = async (
  to,
  subject,
  text,
  maxRetries = 3,
  initialDelay = 1000
) => {
  if (!resend) {
    logger.error("[emailService] Resend client is not initialized");
    return formatResponse({
      success: false,
      error: "Email service not available",
    });
  }

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      lastError = error;
      logger.warn(
        `[emailService] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`
      );

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        logger.info(
          `[emailService] Retrying in ${delay}ms (exponential backoff)...`
        );
        await sleep(delay);
        delay *= 2; // Exponential backoff: double the delay each time
      }
    }
  }

  // All retries failed
  logger.error(
    `[emailService] Failed to send email to ${to} after ${maxRetries + 1} attempts: ${lastError.message}`
  );
  return formatResponse({
    success: false,
    error: lastError.message,
  });
};
