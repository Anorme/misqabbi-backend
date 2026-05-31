import {
  getTransactionByReference,
  updateTransactionStatus,
} from "../models/transaction.model.js";
import { createOrderFromCart } from "../models/order.model.js";
import {
  verifyTransaction,
  verifyWebhookSignature,
} from "../services/paystackService.js";
import {
  sendAdminNewOrderNotification,
  sendCustomerStatusUpdateNotification,
} from "../services/orderEmailService.js";
import { incrementDiscountUsage } from "../models/discount.model.js";
import { recordUsage } from "../models/discountUsage.model.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

function isTransactionOwnedByPrincipal(transaction, principalId) {
  if (!transaction || !principalId) return false;
  const txUserId =
    typeof transaction.user === "object" && transaction.user?._id
      ? transaction.user._id.toString()
      : transaction.user?.toString();
  return txUserId === principalId.toString();
}

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

    // Get raw body as Buffer (from express.raw middleware)
    // Pass Buffer directly to avoid encoding conversion
    const rawBody = req.body;

    // Verify webhook signature FIRST using the original raw body
    if (!verifyWebhookSignature(signature, rawBody)) {
      logger.warn("[payment.controller] Invalid Paystack webhook signature");
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Invalid webhook signature",
        })
      );
    }

    // Parse the body AFTER signature verification
    const { event, data } = JSON.parse(rawBody.toString("utf8"));

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

    // Idempotent check: if order already exists, return early to prevent duplicates
    if (transaction.status === "success" && transaction.order) {
      logger.info(
        `[payment.controller] Order already exists for transaction: ${reference}, Order: ${transaction.order}`
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

    // Prepare discount info if present
    const discountInfo = transaction.orderData.discountId
      ? {
          discountId: transaction.orderData.discountId,
          discountCode: transaction.orderData.discountCode,
          discountAmount: transaction.orderData.discountAmount,
        }
      : null;

    // Create order using stored order data
    const order = await createOrderFromCart(
      transaction.user,
      transaction.orderData.items,
      transaction.orderData.shippingInfo,
      transaction.orderData.totalPrice,
      "accepted", // Default status for new orders
      transaction.orderData.expressService || false,
      transaction.orderData.expressFee || 0,
      discountInfo
    );

    // Update order with payment reference
    order.paymentReference = reference;
    order.paymentStatus = "paid";
    await order.save();

    // Record discount usage if a discount was applied
    if (discountInfo && discountInfo.discountId) {
      try {
        // Record the usage
        await recordUsage({
          discountId: discountInfo.discountId,
          userId: transaction.user,
          amountSaved: discountInfo.discountAmount,
          orderId: order._id,
        });

        // Increment the global usage counter
        await incrementDiscountUsage(discountInfo.discountId);

        logger.info(
          `[payment.controller] Discount usage recorded for code: ${discountInfo.discountCode}, Order: ${order._id}`
        );
      } catch (discountError) {
        // Log but don't fail the order creation if discount tracking fails
        logger.error(
          `[payment.controller] Error recording discount usage: ${discountError.message}`
        );
      }
    }

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

    // Populate order for email notification (no extra query needed)
    await order.populate([
      { path: "items.product", select: "name slug images price" },
      { path: "user", select: "displayName email" },
    ]);

    // Send admin notification asynchronously
    sendAdminNewOrderNotification(order);

    // Send customer confirmation email (status: accepted)
    sendCustomerStatusUpdateNotification(order);
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
    const principalId = req.principal?._id;

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

    if (!isTransactionOwnedByPrincipal(transaction, principalId)) {
      return res.status(403).json(
        formatResponse({
          success: false,
          error: "Access denied for this transaction",
        })
      );
    }

    // If transaction is still pending, verify with Paystack
    if (transaction.status === "pending") {
      try {
        const verificationResult = await verifyTransaction(reference);

        // Explicitly handle each transaction status from Paystack
        if (
          verificationResult.status &&
          verificationResult.data.status === "success"
        ) {
          // Handle successful payment
          await handleSuccessfulPayment(verificationResult.data);

          // Refetch transaction to get updated data
          const updatedTransaction = await getTransactionByReference(reference);
          if (!isTransactionOwnedByPrincipal(updatedTransaction, principalId)) {
            return res.status(403).json(
              formatResponse({
                success: false,
                error: "Access denied for this transaction",
              })
            );
          }
          return res.status(200).json(
            formatResponse({
              message: "Payment verified successfully",
              data: {
                transaction: updatedTransaction,
                order: updatedTransaction.order,
              },
            })
          );
        } else if (
          verificationResult.data &&
          verificationResult.data.status === "failed"
        ) {
          // Explicitly handle failed transactions
          await updateTransactionStatus(reference, "failed");

          const updatedTransaction = await getTransactionByReference(reference);
          return res.status(200).json(
            formatResponse({
              message: "Payment verification failed",
              data: {
                transaction: updatedTransaction,
                order: null,
              },
            })
          );
        } else {
          // Transaction still pending or other status - don't update status
          // This prevents false negatives when frontend polls before payment completion
          const transactionStatus =
            verificationResult.data?.status || "pending";
          logger.info(
            `[payment.controller] Transaction ${reference} still ${transactionStatus}, not updating status`
          );
          // Return current status without modification
        }
      } catch (verifyError) {
        // Don't update status on API errors - let webhook handle it
        // This prevents network errors from corrupting transaction status
        logger.warn(
          `[payment.controller] Error verifying transaction: ${verifyError.message}. Leaving status unchanged, webhook will handle update.`
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
