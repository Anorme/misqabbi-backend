import logger from "../config/logger.js";
import { findDiscountByCode } from "../models/discount.model.js";
import { countUserUsage } from "../models/discountUsage.model.js";
import { countOrdersByUser } from "../models/order.model.js";

/**
 * Error codes for discount validation failures.
 * Used internally for logging and debugging.
 */
export const DISCOUNT_ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  CODE_EXPIRED: "CODE_EXPIRED",
  CODE_INACTIVE: "CODE_INACTIVE",
  USAGE_LIMIT_REACHED: "USAGE_LIMIT_REACHED",
  ALREADY_USED: "ALREADY_USED",
  MIN_ORDER_NOT_MET: "MIN_ORDER_NOT_MET",
  MIN_ITEMS_NOT_MET: "MIN_ITEMS_NOT_MET",
  FIRST_ORDER_ONLY: "FIRST_ORDER_ONLY",
  NO_APPLICABLE_ITEMS: "NO_APPLICABLE_ITEMS",
};

/**
 * Internal error messages for logging purposes.
 * These provide detailed information for debugging but should not be exposed to users.
 */
const INTERNAL_ERROR_MESSAGES = {
  INVALID_CODE: "Discount code not found",
  CODE_EXPIRED: "Discount code has expired",
  CODE_INACTIVE: "Discount code is deactivated",
  USAGE_LIMIT_REACHED: "Global usage limit reached",
  ALREADY_USED: "Per-user usage limit reached",
  MIN_ORDER_NOT_MET: "Minimum order value not met",
  MIN_ITEMS_NOT_MET: "Minimum item count not met",
  FIRST_ORDER_ONLY: "First order restriction failed",
  NO_APPLICABLE_ITEMS: "No applicable items in cart",
};

/**
 * Public-facing error messages for users.
 * Security consideration: Existence-related errors are grouped together to prevent
 * bad actors from enumerating valid discount codes.
 *
 * - INVALID_CODE, CODE_EXPIRED, CODE_INACTIVE → Same generic message (prevents enumeration)
 * - Other errors remain specific (user needs actionable feedback)
 */
export const DISCOUNT_ERROR_MESSAGES = {
  // Grouped for security - don't reveal if code exists but is expired/inactive
  INVALID_CODE: "This discount code is not valid",
  CODE_EXPIRED: "This discount code is not valid",
  CODE_INACTIVE: "This discount code is not valid",
  // Specific messages for actionable errors
  USAGE_LIMIT_REACHED: "This discount code has reached its usage limit",
  ALREADY_USED: "You have already used this discount code",
  MIN_ORDER_NOT_MET: "Minimum order value of GHS {amount} required",
  MIN_ITEMS_NOT_MET: "Minimum of {count} items required",
  FIRST_ORDER_ONLY: "This discount code is only valid for your first order",
  NO_APPLICABLE_ITEMS: "No items in your cart are eligible for this discount",
};

/**
 * Validate a discount code for a user and cart.
 *
 * @param {String} code - Discount code to validate
 * @param {String} userId - ID of the user applying the discount
 * @param {Object} cartData - Cart information
 * @param {Number} cartData.cartTotal - Total cart value in GHS
 * @param {Number} cartData.itemCount - Number of items in cart
 * @param {Array} cartData.items - Cart items with product info
 * @returns {Promise<Object>} - Validation result with discount info or error
 */
export async function validateDiscountCode(code, userId, cartData) {
  try {
    // Helper to create validation failure response with internal logging
    const validationFailed = (errorCode, messageOverride = null) => {
      // Log detailed error internally for debugging
      logger.info(
        `[discountService] Discount validation failed for code "${code}", user ${userId}: ${INTERNAL_ERROR_MESSAGES[errorCode]}`
      );
      return {
        valid: false,
        errorCode,
        message: messageOverride || DISCOUNT_ERROR_MESSAGES[errorCode],
      };
    };

    // 1. Find the discount code
    const discount = await findDiscountByCode(code);

    if (!discount) {
      return validationFailed(DISCOUNT_ERROR_CODES.INVALID_CODE);
    }

    // 2. Check if discount is active
    if (!discount.isActive) {
      return validationFailed(DISCOUNT_ERROR_CODES.CODE_INACTIVE);
    }

    // 3. Check if discount has expired
    if (discount.expiryDate < new Date()) {
      return validationFailed(DISCOUNT_ERROR_CODES.CODE_EXPIRED);
    }

    // 4. Check global usage limit
    if (discount.hasReachedGlobalLimit()) {
      return validationFailed(DISCOUNT_ERROR_CODES.USAGE_LIMIT_REACHED);
    }

    // 5. Check per-user usage limit
    const userUsageCount = await countUserUsage(discount._id, userId);
    const maxPerUser =
      discount.usageType === "per_user" ? discount.maxUsesPerUser : 1;

    if (userUsageCount >= maxPerUser) {
      return validationFailed(DISCOUNT_ERROR_CODES.ALREADY_USED);
    }

    // 6. Check first order restriction
    if (discount.firstOrderOnly) {
      const orderCount = await countOrdersByUser(userId);
      if (orderCount > 0) {
        return validationFailed(DISCOUNT_ERROR_CODES.FIRST_ORDER_ONLY);
      }
    }

    // 7. Check minimum order value
    if (
      discount.minOrderValue !== null &&
      cartData.cartTotal < discount.minOrderValue
    ) {
      return validationFailed(
        DISCOUNT_ERROR_CODES.MIN_ORDER_NOT_MET,
        DISCOUNT_ERROR_MESSAGES.MIN_ORDER_NOT_MET.replace(
          "{amount}",
          discount.minOrderValue.toFixed(2)
        )
      );
    }

    // 8. Check minimum item count
    if (
      discount.minItemCount !== null &&
      cartData.itemCount < discount.minItemCount
    ) {
      return validationFailed(
        DISCOUNT_ERROR_CODES.MIN_ITEMS_NOT_MET,
        DISCOUNT_ERROR_MESSAGES.MIN_ITEMS_NOT_MET.replace(
          "{count}",
          discount.minItemCount
        )
      );
    }

    // 9. Check product scope and calculate applicable amount
    let applicableAmount = cartData.cartTotal;
    let applicableItems = cartData.items || [];

    if (discount.scope === "products") {
      const { amount, items } = calculateApplicableAmount(
        discount,
        cartData.items
      );
      applicableAmount = amount;
      applicableItems = items;

      if (applicableAmount === 0) {
        return validationFailed(DISCOUNT_ERROR_CODES.NO_APPLICABLE_ITEMS);
      }
    }

    // 10. Calculate discount amount
    const discountAmount = calculateDiscount(
      discount,
      cartData.cartTotal,
      applicableAmount
    );

    logger.info(
      `[discountService] Discount ${code} validated successfully for user ${userId}`
    );

    return {
      valid: true,
      discount: {
        id: discount._id,
        code: discount.code,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        maxDiscountAmount: discount.maxDiscountAmount,
        scope: discount.scope,
      },
      discountAmount,
      applicableAmount,
      applicableItemCount: applicableItems.length,
      finalTotal: Math.max(0, cartData.cartTotal - discountAmount),
    };
  } catch (error) {
    logger.error(
      `[discountService] Error validating discount code: ${error.message}`
    );
    throw error;
  }
}

/**
 * Calculate the applicable amount for product-scoped discounts.
 *
 * @param {Object} discount - Discount document
 * @param {Array} cartItems - Cart items with product info
 * @returns {Object} - { amount, items } applicable amount and matching items
 */
export function calculateApplicableAmount(discount, cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return { amount: 0, items: [] };
  }

  const applicableProductIds = new Set(
    discount.applicableProducts.map(id => id.toString())
  );
  const applicableCategories = new Set(
    discount.applicableCategories.map(cat => cat.toLowerCase())
  );

  let applicableAmount = 0;
  const applicableItems = [];

  for (const item of cartItems) {
    const productId = item.product?._id?.toString() || item.product?.toString();
    const category =
      item.product?.category?.toLowerCase() || item.category?.toLowerCase();

    const isProductMatch =
      applicableProductIds.size > 0 && applicableProductIds.has(productId);
    const isCategoryMatch =
      applicableCategories.size > 0 && applicableCategories.has(category);

    if (isProductMatch || isCategoryMatch) {
      const itemTotal =
        (item.price || item.product?.price || 0) * (item.quantity || 1);
      applicableAmount += itemTotal;
      applicableItems.push(item);
    }
  }

  return { amount: applicableAmount, items: applicableItems };
}

/**
 * Calculate the discount amount based on discount type and applicable amount.
 *
 * @param {Object} discount - Discount document
 * @param {Number} cartTotal - Total cart value
 * @param {Number} applicableAmount - Amount the discount applies to
 * @returns {Number} - Calculated discount amount
 */
export function calculateDiscount(discount, cartTotal, applicableAmount) {
  const baseAmount = discount.scope === "order" ? cartTotal : applicableAmount;

  let discountAmount;

  if (discount.discountType === "percentage") {
    discountAmount = baseAmount * (discount.discountValue / 100);

    // Apply cap if set
    if (discount.maxDiscountAmount !== null && discount.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }
  } else {
    // Fixed amount discount
    discountAmount = Math.min(discount.discountValue, baseAmount);
  }

  // Round to 2 decimal places
  return Math.round(discountAmount * 100) / 100;
}

/**
 * Format discount for display to users.
 *
 * @param {Object} discount - Discount document
 * @returns {String} - Formatted discount description
 */
export function formatDiscountDescription(discount) {
  if (discount.discountType === "percentage") {
    let description = `${discount.discountValue}% off`;
    if (discount.maxDiscountAmount) {
      description += ` (up to GHS ${discount.maxDiscountAmount.toFixed(2)})`;
    }
    return description;
  } else {
    return `GHS ${discount.discountValue.toFixed(2)} off`;
  }
}

/**
 * Validate discount for checkout (streamlined version for checkout flow).
 * Returns discount info needed for order creation.
 *
 * @param {String} code - Discount code
 * @param {String} userId - User ID
 * @param {Object} cartData - Cart data
 * @returns {Promise<Object>} - Discount info for checkout or null if invalid
 */
export async function validateDiscountForCheckout(code, userId, cartData) {
  const result = await validateDiscountCode(code, userId, cartData);

  if (!result.valid) {
    return {
      valid: false,
      errorCode: result.errorCode,
      message: result.message,
    };
  }

  return {
    valid: true,
    discountId: result.discount.id,
    discountCode: result.discount.code,
    discountAmount: result.discountAmount,
    discountType: result.discount.discountType,
    discountValue: result.discount.discountValue,
  };
}
