import { formatCurrency } from "../utils/formatters.js";

/**
 * Determines if an order is singular (1 item with quantity 1) or plural
 * @param {Object} order - Order object
 * @returns {boolean} true if singular, false if plural
 */
function isSingularOrder(order) {
  return order.items.length === 1 && order.items[0].quantity === 1;
}

export const PASSWORD_RESET_EMAIL = url => `
Hey Gorgeous,

We received a request to reset your Misqabbi password. No worries—these things happen.

Click the link below to securely reset your password and return to your personalized Misqabbi experience:

${url}

If you didn't request this password reset, no worries at all - simply ignore this email and your account will remain secure.

Remember, taking care of your digital space is an act of self-care. You've got this! 💕

With love and support,
The Misqabbi Team
`;

export const CONTACT_FORM_EMAIL = (name, email, message) => `
New Contact Form Submission

You have received a new message from the Misqabbi contact form:

From: ${name}
Email: ${email}

Message:
${message}

---
This message was sent via the Misqabbi contact form.
`;

/**
 * Admin notification email when a new order is created
 * @param {Object} order - Order object
 * @param {string} adminOrderUrl - Computed admin order URL
 */
export const ADMIN_NEW_ORDER_EMAIL = (order, adminOrderUrl) => {
  const isSingular = isSingularOrder(order);
  const itemLabel = isSingular ? "Item" : "Items";

  const itemsList = order.items
    .map(
      item =>
        `  - ${item.product.name} (Qty: ${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`
    )
    .join("\n");

  return `New Order Received

A new order has been placed!

Order Details:
Order ID: ${order._id}
Date: ${order.createdAt}
Customer: ${order.shippingInfo.fullName}
Email: ${order.shippingInfo.email}
Phone: ${order.shippingInfo.phone}

${itemLabel}:
${itemsList}

Total: ${formatCurrency(order.totalPrice)}
Payment Reference: ${order.paymentReference}

Shipping Address:
${order.shippingInfo.deliveryAddress}
${order.shippingInfo.deliveryNotes ? `\nDelivery Notes: ${order.shippingInfo.deliveryNotes}` : ""}

Current Status: ${order.status}

Manage this order: ${adminOrderUrl}

---
This is an automated notification from the Misqabbi order system.`;
};

/**
 * Customer order status update email
 * @param {Object} order - Order object
 * @param {string} viewOrderUrl - Computed customer order view URL
 */
export const CUSTOMER_ORDER_STATUS_EMAIL = (order, viewOrderUrl) => {
  const isSingular = isSingularOrder(order);
  const itemLabel = isSingular ? "Item" : "Items";

  const statusMessages = {
    accepted: {
      title: "Your Order Has Been Accepted! 💕",
      message: isSingular
        ? "Wonderful news! We've received your order and it's been accepted. Our team is getting ready to bring this beautiful piece to life. We're so excited to create something special just for you!"
        : "Wonderful news! We've received your order and it's been accepted. Our team is getting ready to bring your beautiful pieces to life. We're so excited to create something special just for you!",
    },
    processing: {
      title: "Your Order is Being Processed ✨",
      message: isSingular
        ? "Great news! Your order is now being processed. Our skilled artisans are carefully working on your made-to-measure piece. Every stitch is crafted with love and attention to detail, just for you."
        : "Great news! Your order is now being processed. Our skilled artisans are carefully working on your made-to-measure pieces. Every stitch is crafted with love and attention to detail, just for you.",
    },
    ready: {
      title: "Your Order is Ready! 🌟",
      message: isSingular
        ? "Exciting news! Your order is ready and waiting for you. We've carefully prepared this beautiful piece, and it's all set to make its way to you. You're going to love it!"
        : "Exciting news! Your order is ready and waiting for you. We've carefully prepared your beautiful pieces, and they're all set to make their way to you. You're going to love them!",
    },
    enroute_pickup: {
      title: "Your Order is On Its Way to Pickup! 🚗",
      message: isSingular
        ? "Your order is on its way to the pickup location! It won't be long now before you can collect your beautiful piece. We can't wait for you to see it!"
        : "Your order is on its way to the pickup location! It won't be long now before you can collect your beautiful pieces. We can't wait for you to see them!",
    },
    picked_up: {
      title: "Your Order Has Been Picked Up! 📦",
      message: isSingular
        ? "Your order has been picked up and is now in transit to you. The journey to your doorstep has begun! We're so excited and can't wait for you to receive your beautiful piece."
        : "Your order has been picked up and is now in transit to you. The journey to your doorstep has begun! We're so excited and can't wait for you to receive your special pieces.",
    },
    in_transit: {
      title: "Your Order is In Transit! 🌍",
      message: isSingular
        ? "Your order is on its way to you! It's making its journey to your address, and we're tracking it every step of the way. You'll be wearing your beautiful piece soon!"
        : "Your order is on its way to you! It's making its journey to your address, and we're tracking it every step of the way. You'll be wearing your beautiful pieces soon!",
    },
    arrived: {
      title: "Your Order Has Arrived! 🎉",
      message: isSingular
        ? "Wonderful news! Your order has arrived at its destination. Your beautiful Misqabbi piece is ready for you. We hope you love it as much as we loved creating it for you!"
        : "Wonderful news! Your order has arrived at its destination. Your beautiful Misqabbi pieces are ready for you. We hope you love them as much as we loved creating them for you!",
    },
  };

  const statusInfo = statusMessages[order.status] || {
    title: "Order Status Update",
    message: `Your order status has been updated to ${order.status}.`,
  };

  const itemsSummary = order.items
    .map(item => `  - ${item.product.name} x${item.quantity}`)
    .join("\n");

  return `${statusInfo.title}

${statusInfo.message}

Order Summary:
Order ID: ${order._id}
Date: ${order.createdAt}

${itemLabel}:
${itemsSummary}

Total: ${formatCurrency(order.totalPrice)}

View your order details: ${viewOrderUrl}

We're here for you every step of the way. If you have any questions or need assistance, please don't hesitate to reach out.

With love and support,
Your Girlies at Misqabbi 💕`;
};
