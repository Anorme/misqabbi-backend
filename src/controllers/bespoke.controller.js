import env from "../config/env.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { sendEmail } from "../services/emailService.js";
import { BESPOKE_EMAIL } from "../constants/emailTemplates.js";

/**
 * @route   POST /bespoke
 * @desc    Submit a bespoke form and send email to EMAIL_USER (same as contact). No persistence.
 * @access  Public (guests and logged-in users)
 *
 * Workflow:
 * - Multipart form parsed by multer; reference photos uploaded to Cloudinary; URLs attached to body
 * - Validates form data via validateBespoke middleware
 * - Builds email from BESPOKE_EMAIL template and sends to env.EMAIL_USER
 * - Returns 201 with success message or 4xx/5xx with message for frontend toast
 */
export async function submitBespoke(req, res) {
  const {
    fullName,
    email,
    phone,
    garmentType,
    garmentTypeOther,
    measurements,
    styleNotes,
    description,
    referencePhotoUrls = [],
  } = req.body;

  try {
    logger.info(`[submitBespoke] Bespoke form submission from: ${email}`);

    const subject = `New bespoke from ${fullName}`;
    const payload = {
      fullName,
      email,
      phone: phone || "",
      garmentType: garmentType || "",
      garmentTypeOther: garmentTypeOther || "",
      measurements: measurements || "",
      styleNotes: styleNotes || "",
      description,
      referencePhotoUrls,
    };
    const emailContent = BESPOKE_EMAIL(payload);

    const result = await sendEmail(env.EMAIL_USER, subject, emailContent);

    if (result.success !== false) {
      logger.info(
        `[submitBespoke] Successfully sent bespoke email from: ${email}`
      );
      return res.status(201).json(
        formatResponse({
          message: "Bespoke form submitted successfully",
        })
      );
    }

    logger.error(`[submitBespoke] Failed to send bespoke email from: ${email}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to submit bespoke form",
        error: result.error,
      })
    );
  } catch (error) {
    logger.error(`[submitBespoke] Unexpected error: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to submit bespoke form",
      })
    );
  }
}
