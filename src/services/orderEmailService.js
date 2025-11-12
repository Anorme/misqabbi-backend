import env from "../config/env.js";
import logger from "../config/logger.js";
import { sendEmail } from "./emailService.js";
import {
  ADMIN_NEW_ORDER_EMAIL,
  CUSTOMER_ORDER_STATUS_EMAIL,
} from "../constants/emailTemplates.js";

/**
 * Sends admin notification when a new order is created
 * @param {Object} order - Order object with populated fields
 */
export async function sendAdminNewOrderNotification(order) {
  try {
    // Compute admin order URL
    const adminOrderUrl = `${env.CLIENT_URL}/admin/orders/${order._id}`;

    const emailContent = ADMIN_NEW_ORDER_EMAIL(order, adminOrderUrl);
    const subject = `New Order #${order._id.toString().slice(-6)} - ${order.shippingInfo.fullName}`;

    // Fire and forget - don't await, don't block
    sendEmail(env.EMAIL_USER, subject, emailContent).catch(error => {
      logger.error(
        `[orderEmailService] Admin notification failed for order ${order._id}: ${error.message}`
      );
    });
    logger.info(
      `[orderEmailService] Admin notification queued for order ${order._id}`
    );
  } catch (error) {
    logger.error(
      `[orderEmailService] Failed to queue admin notification: ${error.message}`
    );
  }
}

/**
 * Sends customer notification when order status is updated
 * @param {Object} order - Order object with populated fields
 */
export async function sendCustomerStatusUpdateNotification(order) {
  try {
    // Compute customer order view URL
    const viewOrderUrl = `${env.CLIENT_URL}/orders/${order._id}`;

    const emailContent = CUSTOMER_ORDER_STATUS_EMAIL(order, viewOrderUrl);
    const statusDisplayName = order.status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const subject = `Your Misqabbi Order - ${statusDisplayName}`;

    const customerEmail = order.shippingInfo?.email || order.user?.email;

    if (!customerEmail) {
      logger.warn(`[orderEmailService] No email found for order ${order._id}`);
      return;
    }

    // Fire and forget - don't await, don't block
    sendEmail(customerEmail, subject, emailContent).catch(error => {
      logger.error(
        `[orderEmailService] Customer notification failed for order ${order._id}: ${error.message}`
      );
    });
    logger.info(
      `[orderEmailService] Customer status update notification queued for order ${order._id}`
    );
  } catch (error) {
    logger.error(
      `[orderEmailService] Failed to queue customer notification: ${error.message}`
    );
  }
}
