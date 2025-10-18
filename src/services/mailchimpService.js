import env from "../config/env.js";
import mailchimp from "@mailchimp/mailchimp_marketing";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

// Initialize Mailchimp client
mailchimp.setConfig({
  apiKey: env.MAILCHIMP_API_KEY,
  server: env.MAILCHIMP_SERVER_PREFIX,
});

/**
 * Subscribe an email to a Mailchimp list
 * @param {string} email - The email address to subscribe
 * @param {string} listId - The Mailchimp list ID (optional, uses env default)
 * @returns {Object} Formatted response object
 */
export const subscribeToList = async (
  email,
  listId = env.MAILCHIMP_LIST_ID
) => {
  try {
    // Check if member already exists
    try {
      await mailchimp.lists.getListMember(listId, email);
      logger.warn(`[mailchimpService] Email already exists in list: ${email}`);
      return formatResponse({
        success: false,
        message: "Email already subscribed",
      });
    } catch (error) {
      // If error is not "member not found", re-throw it
      if (error.status !== 404) {
        throw error;
      }
      // Member not found, proceed with subscription
    }

    // Add member to list
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: "subscribed",
    });

    logger.info(
      `[mailchimpService] Successfully subscribed ${email} to list ${listId}`
    );
    return formatResponse({
      success: true,
      message: "Successfully subscribed to newsletter",
      data: {
        id: response.id,
        email: response.email_address,
        status: response.status,
      },
    });
  } catch (error) {
    logger.error(
      `[mailchimpService] Error subscribing ${email}: ${error.message}`
    );

    // Handle specific Mailchimp errors
    if (error.status === 400) {
      return formatResponse({
        success: false,
        message: "Invalid email address",
      });
    }

    if (error.status === 401) {
      logger.error("[mailchimpService] Invalid Mailchimp API key");
      return formatResponse({
        success: false,
        message: "Service configuration error",
      });
    }

    return formatResponse({
      success: false,
      message: "Failed to subscribe to newsletter",
    });
  }
};
