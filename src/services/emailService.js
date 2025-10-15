import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import env from "../config/env.js";

let transporter;
console.log("EMAIL_USER:", env.EMAIL_USER);
console.log("EMAIL_PASS:", env.EMAIL_PASS ? "Loaded" : "Missing");

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

  // Optionally verify connection once
  transporter
    .verify()
    .then(() => logger.info("✅ Mail transporter is ready"))
    .catch(err =>
      logger.error(`[sendEmail] Transporter verify failed: ${err.message}`)
    );
} catch (error) {
  logger.error(`[sendEmail] Transporter creation failed: ${error.message}`);
  console.error("Full error:", error);
}

export const sendEmail = async (to, subject, text) => {
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
