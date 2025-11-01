import env from "../config/env.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { sendEmail } from "../services/emailService.js";
import { CONTACT_FORM_EMAIL } from "../constants/emailTemplates.js";

/**
 * @route   POST /contact
 * @desc    Submit a contact form and send email to EMAIL_FROM
 * @access  Public
 *
 * Workflow:
 * - Validates form data via middleware (name, email, message)
 * - Generates email subject
 * - Formats email content using template
 * - Sends email to EMAIL_FROM using emailService
 * - Returns appropriate HTTP response based on service result
 * - Logs submission attempts and results
 */
export async function submitContact(req, res) {
  const { name, email, message } = req.body;

  try {
    logger.info(`[submitContact] Contact form submission from: ${email}`);

    const subject = `New Contact Form Submission from ${name}`;
    const emailContent = CONTACT_FORM_EMAIL(name, email, message);

    const result = await sendEmail(env.EMAIL_FROM, subject, emailContent);

    if (result.success !== false) {
      logger.info(
        `[submitContact] Successfully sent contact form email from: ${email}`
      );
      return res.status(200).json(
        formatResponse({
          message: "Contact form submitted successfully",
        })
      );
    } else {
      logger.error(
        `[submitContact] Failed to send contact form email from: ${email}`
      );
      return res.status(500).json(
        formatResponse({
          success: false,
          message: "Failed to submit contact form",
          error: result.error,
        })
      );
    }
  } catch (error) {
    logger.error(`[submitContact] Unexpected error: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to submit contact form",
      })
    );
  }
}
