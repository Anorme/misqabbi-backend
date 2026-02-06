import logger from "../config/logger.js";
import {
  validateDiscountCode,
  formatDiscountDescription,
} from "../services/discountService.js";

/**
 * Validate a discount code for the current user.
 * POST /discounts/validate
 *
 * Expects body:
 * - code: string (required) - The discount code to validate
 * - cartTotal: number (required) - Current cart total in GHS
 * - itemCount: number (required) - Number of items in cart
 * - items: array (optional) - Cart items with product info for product-scoped discounts
 */
export async function validateDiscountHandler(req, res) {
  try {
    const { code, cartTotal, itemCount, items } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Discount code is required",
      });
    }

    if (cartTotal === undefined || cartTotal === null) {
      return res.status(400).json({
        success: false,
        error: "Cart total is required",
      });
    }

    if (itemCount === undefined || itemCount === null) {
      return res.status(400).json({
        success: false,
        error: "Item count is required",
      });
    }

    if (cartTotal < 0) {
      return res.status(400).json({
        success: false,
        error: "Cart total cannot be negative",
      });
    }

    if (itemCount < 0) {
      return res.status(400).json({
        success: false,
        error: "Item count cannot be negative",
      });
    }

    const userId = req.user._id;

    const cartData = {
      cartTotal: parseFloat(cartTotal),
      itemCount: parseInt(itemCount),
      items: items || [],
    };

    const result = await validateDiscountCode(code, userId, cartData);

    if (!result.valid) {
      logger.info(
        `[discountUser.controller] Discount validation failed for user ${userId}: ${result.errorCode}`
      );

      return res.status(400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.message,
      });
    }

    // Format response with user-friendly discount description
    const discountDescription = formatDiscountDescription(result.discount);

    logger.info(
      `[discountUser.controller] Discount ${code} validated successfully for user ${userId}`
    );

    return res.status(200).json({
      success: true,
      message: "Discount code is valid",
      data: {
        code: result.discount.code,
        description: result.discount.description || discountDescription,
        discountType: result.discount.discountType,
        discountValue: result.discount.discountValue,
        discountAmount: result.discountAmount,
        originalTotal: cartData.cartTotal,
        finalTotal: result.finalTotal,
        savings: discountDescription,
      },
    });
  } catch (error) {
    logger.error(
      `[discountUser.controller] Error validating discount: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to validate discount code",
    });
  }
}
