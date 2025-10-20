import axios from "axios";
import crypto from "crypto";
import env from "../config/env.js";
import logger from "../config/logger.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Initialize a transaction with Paystack
 * @param {string} email - Customer email
 * @param {number} amount - Amount in pesewas
 * @param {object} metadata - Additional data to store with transaction
 * @param {string} reference - Unique transaction reference
 * @returns {Promise<object>} Paystack response with authorization_url
 */
export async function initializeTransaction(
  email,
  amount,
  metadata,
  reference
) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount,
        reference,
        metadata,
        currency: "GHS", // Ghana Cedis
      },
      {
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      logger.info(
        `[paystackService] Transaction initialized successfully: ${reference}`
      );
      return response.data;
    } else {
      throw new Error(
        response.data.message || "Failed to initialize transaction"
      );
    }
  } catch (error) {
    logger.error(
      `[paystackService] Error initializing transaction: ${error.message}`
    );
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to initialize transaction with Paystack");
  }
}

/**
 * Verify a transaction with Paystack
 * @param {string} reference - Transaction reference
 * @returns {Promise<object>} Paystack verification response
 */
export async function verifyTransaction(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      logger.info(
        `[paystackService] Transaction verified successfully: ${reference}`
      );
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to verify transaction");
    }
  } catch (error) {
    logger.error(
      `[paystackService] Error verifying transaction: ${error.message}`
    );
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Failed to verify transaction with Paystack");
  }
}

/**
 * Verify Paystack webhook signature
 * @param {string} signature - Paystack signature from headers
 * @param {string} body - Raw request body
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(signature, body) {
  try {
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
      .update(body, "utf8")
      .digest("hex");

    return hash === signature;
  } catch (error) {
    logger.error(
      `[paystackService] Error verifying webhook signature: ${error.message}`
    );
    return false;
  }
}

/**
 * Generate a unique transaction reference
 * @param {string} userId - User ID
 * @returns {string} Unique reference
 */
export function generateTransactionReference(userId) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MISQ_${timestamp}_${userId}_${randomSuffix}`;
}

/**
 * Convert Ghana Cedis to pesewas
 * @param {number} cedis - Amount in Ghana Cedis
 * @returns {number} Amount in pesewas
 */
export function convertToPesewas(cedis) {
  return Math.round(cedis * 100);
}

/**
 * Convert pesewas to Ghana Cedis
 * @param {number} pesewas - Amount in pesewas
 * @returns {number} Amount in Ghana Cedis
 */
export function convertToCedis(pesewas) {
  return pesewas / 100;
}
