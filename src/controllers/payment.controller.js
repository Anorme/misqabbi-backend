import {
  getTransactionByReference,
  updateTransactionStatus,
} from "../models/transaction.model.js";
import { createOrderFromCart } from "../models/order.model.js";
import {
  verifyTransaction,
  verifyWebhookSignature,
} from "../services/paystackService.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

/**
 * Handle Paystack webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handlePaystackWebhook = async (req, res) => {
  try {
    // Get the signature from headers
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      logger.warn(
        "[payment.controller] No Paystack signature found in headers"
      );
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Missing Paystack signature",
        })
      );
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(signature, rawBody)) {
      logger.warn("[payment.controller] Invalid Paystack webhook signature");
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Invalid webhook signature",
        })
      );
    }

    const { event, data } = req.body;

    logger.info(
      `[payment.controller] Received Paystack webhook event: ${event}`
    );

    // Handle different event types
    switch (event) {
      case "charge.success":
        await handleSuccessfulPayment(data);
        break;

      case "charge.failed":
        await handleFailedPayment(data);
        break;

      default:
        logger.info(`[payment.controller] Unhandled event type: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json(
      formatResponse({
        message: "Webhook processed successfully",
      })
    );
  } catch (error) {
    logger.error(
      `[payment.controller] Error processing webhook: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Webhook processing failed",
      })
    );
  }
};

/**
 * Handle successful payment
 * @param {Object} data - Paystack event data
 */
async function handleSuccessfulPayment(data) {
  try {
    const { reference, amount } = data;

    // Get transaction from database
    const transaction = await getTransactionByReference(reference);

    if (!transaction) {
      logger.warn(
        `[payment.controller] Transaction not found for reference: ${reference}`
      );
      return;
    }

    // Verify amount matches
    if (transaction.amount !== amount) {
      logger.warn(
        `[payment.controller] Amount mismatch for reference: ${reference}. Expected: ${transaction.amount}, Received: ${amount}`
      );
      await updateTransactionStatus(reference, "failed");
      return;
    }

    // Double verification with Paystack API
    const verificationResult = await verifyTransaction(reference);

    if (
      !verificationResult.status ||
      verificationResult.data.status !== "success"
    ) {
      logger.warn(
        `[payment.controller] Paystack verification failed for reference: ${reference}`
      );
      await updateTransactionStatus(reference, "failed");
      return;
    }

    // Create order using stored order data
    const order = await createOrderFromCart(
      transaction.user,
      transaction.orderData.items,
      transaction.orderData.shippingInfo,
      transaction.orderData.totalPrice,
      "accepted" // Default status for new orders
    );

    // Update order with payment reference
    order.paymentReference = reference;
    order.paymentStatus = "paid";
    await order.save();

    // Update transaction status and link order
    await updateTransactionStatus(
      reference,
      "success",
      order._id,
      verificationResult
    );

    logger.info(
      `[payment.controller] Order created successfully for transaction: ${reference}, Order: ${order._id}`
    );
  } catch (error) {
    logger.error(
      `[payment.controller] Error handling successful payment: ${error.message}`
    );
    throw error;
  }
}

/**
 * Handle failed payment
 * @param {Object} data - Paystack event data
 */
async function handleFailedPayment(data) {
  try {
    const { reference } = data;

    // Update transaction status to failed
    await updateTransactionStatus(reference, "failed");

    logger.info(
      `[payment.controller] Payment failed for transaction: ${reference}`
    );
  } catch (error) {
    logger.error(
      `[payment.controller] Error handling failed payment: ${error.message}`
    );
    throw error;
  }
}

/**
 * Verify payment status manually (for frontend use)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Reference is required",
        })
      );
    }

    // Get transaction from database
    const transaction = await getTransactionByReference(reference);

    if (!transaction) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Transaction not found",
        })
      );
    }

    // If transaction is still pending, verify with Paystack
    if (transaction.status === "pending") {
      try {
        const verificationResult = await verifyTransaction(reference);

        if (
          verificationResult.status &&
          verificationResult.data.status === "success"
        ) {
          // Handle successful payment
          await handleSuccessfulPayment(verificationResult.data);

          // Refetch transaction to get updated data
          const updatedTransaction = await getTransactionByReference(reference);
          return res.status(200).json(
            formatResponse({
              message: "Payment verified successfully",
              data: {
                transaction: updatedTransaction,
                order: updatedTransaction.order,
              },
            })
          );
        } else {
          // Update to failed if verification shows failure
          await updateTransactionStatus(reference, "failed");
        }
      } catch (verifyError) {
        logger.warn(
          `[payment.controller] Error verifying transaction: ${verifyError.message}`
        );
      }
    }

    // Return current transaction status
    res.status(200).json(
      formatResponse({
        message: "Payment status retrieved",
        data: {
          transaction,
          order: transaction.order,
        },
      })
    );
  } catch (error) {
    logger.error(
      `[payment.controller] Error verifying payment: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Payment verification failed",
      })
    );
  }
};
