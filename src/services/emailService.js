import env from "../config/env.js";
import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

let transporter;

if (!env.EMAIL_USER || !env.EMAIL_PASS) {
  logger.warn("[emailService] Missing email credentials");
}

try {
  transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  // Verify connection once
  transporter
    .verify()
    .then(() => logger.info("Mail transporter is ready"))
    .catch(err =>
      logger.error(
        `[emailService] Transporter verification failed: ${err.message}`
      )
    );
} catch (error) {
  logger.error(`[emailService] Transporter creation failed: ${error.message}`);
}

export const sendEmail = async (to, subject, text) => {
  if (!transporter) {
    logger.error("[emailService] Transporter is not initialized");
    return formatResponse({
      success: false,
      error: "Email service not available",
    });
  }

  try {
    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
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
