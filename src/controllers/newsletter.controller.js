import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { subscribeToList } from "../services/mailchimpService.js";

/**
 * @route   POST /newsletter/subscribe
 * @desc    Subscribe an email to the newsletter
 * @access  Public
 *
 * Workflow:
 * - Validates email format via middleware
 * - Calls Mailchimp service to subscribe email
 * - Returns appropriate HTTP response based on service result
 * - Logs subscription attempts and results
 */
export async function subscribeNewsletter(req, res) {
  const { email } = req.body;

  try {
    logger.info(`[subscribeNewsletter] Subscription attempt for: ${email}`);

    const result = await subscribeToList(email);

    if (result.success) {
      logger.info(`[subscribeNewsletter] Successfully subscribed: ${email}`);
      return res.status(200).json(result);
    } else {
      // Handle already subscribed case
      if (result.message === "Email already subscribed") {
        logger.warn(`[subscribeNewsletter] Email already subscribed: ${email}`);
        return res.status(400).json(result);
      }

      // Handle other errors
      logger.error(`[subscribeNewsletter] Failed to subscribe: ${email}`);
      return res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`[subscribeNewsletter] Unexpected error: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to subscribe to newsletter",
      })
    );
  }
}
