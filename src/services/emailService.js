import env from "../config/env.js";
import nodemailer from "nodemailer";
import logger from "../config/logger.js";

let transporter;

if(!env.EMAIL_USER || !env.EMAIL_PASS) {
  logger.warn([emailService]: "Missing email credentials")
}

try {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
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
      logger.error(`[sendEmail] Transporter verification failed: ${err.message}`)
    );
} catch (error) {
  logger.error(`[sendEmail] Transporter creation failed: ${error.message}`);
  console.error("Full error:", error);
}

export const sendEmail = async (to, subject, text) => {
  if(!transporter) {
    logger.error("[sendEmail] Transporter is not initialized");
    return { success: false, error: "Email service not available" }
   }
  
  try {
    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`[sendEmail] Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error(`[sendEmail] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};
