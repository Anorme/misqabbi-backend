import { Types } from "mongoose";
import DiscountUsage from "./discountUsage.mongo.js";
import logger from "../config/logger.js";

/**
 * Record a discount usage.
 *
 * @param {Object} usageData - Usage data
 * @param {String} usageData.discountId - ID of the discount used
 * @param {String} usageData.userId - ID of the user who used it
 * @param {Number} usageData.amountSaved - Amount saved by the user
 * @param {String} usageData.orderId - Optional order ID (can be linked later)
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} - Created usage document
 */
export async function recordUsage(usageData, session = null) {
  try {
    const usage = new DiscountUsage({
      discount: usageData.discountId,
      user: usageData.userId,
      amountSaved: usageData.amountSaved,
      order: usageData.orderId || null,
      usedAt: new Date(),
    });

    if (session) {
      return await usage.save({ session });
    }
    return await usage.save();
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error recording usage: ${error.message}`
    );
    throw error;
  }
}

/**
 * Count how many times a user has used a specific discount.
 *
 * @param {String} discountId - Discount ID
 * @param {String} userId - User ID
 * @returns {Promise<Number>} - Usage count for this user
 */
export async function countUserUsage(discountId, userId) {
  try {
    return await DiscountUsage.countDocuments({
      discount: discountId,
      user: userId,
    });
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error counting user usage: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get all usage records for a specific discount.
 *
 * @param {String} discountId - Discount ID
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Array>} - Array of usage records
 */
export async function getUsageByDiscount(discountId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    return await DiscountUsage.find({ discount: discountId })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "displayName email" })
      .populate({ path: "order", select: "totalPrice status createdAt" });
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error getting usage by discount: ${error.message}`
    );
    throw error;
  }
}

/**
 * Count total usage records for a specific discount.
 *
 * @param {String} discountId - Discount ID
 * @returns {Promise<Number>} - Total usage count
 */
export async function countUsageByDiscount(discountId) {
  try {
    return await DiscountUsage.countDocuments({ discount: discountId });
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error counting usage by discount: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get all discount usages for a specific user.
 *
 * @param {String} userId - User ID
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Array>} - Array of usage records
 */
export async function getUsageByUser(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    return await DiscountUsage.find({ user: userId })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "discount", select: "code discountType discountValue" })
      .populate({ path: "order", select: "totalPrice status createdAt" });
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error getting usage by user: ${error.message}`
    );
    throw error;
  }
}

/**
 * Link an order to an existing usage record.
 * Used after payment is confirmed.
 *
 * @param {String} usageId - Usage record ID
 * @param {String} orderId - Order ID to link
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} - Updated usage record
 */
export async function linkOrderToUsage(usageId, orderId, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    return await DiscountUsage.findByIdAndUpdate(
      usageId,
      { order: orderId },
      options
    );
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error linking order to usage: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get total amount saved through discounts.
 *
 * @param {Object} params - Filter parameters
 * @param {Date} params.startDate - Optional start date
 * @param {Date} params.endDate - Optional end date
 * @returns {Promise<Number>} - Total amount saved
 */
export async function getTotalAmountSaved(params = {}) {
  try {
    const match = {};

    if (params.startDate || params.endDate) {
      match.usedAt = {};
      if (params.startDate) {
        match.usedAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        match.usedAt.$lte = new Date(params.endDate);
      }
    }

    const result = await DiscountUsage.aggregate([
      { $match: match },
      { $group: { _id: null, totalSaved: { $sum: "$amountSaved" } } },
    ]);

    return result[0]?.totalSaved || 0;
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error getting total amount saved: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get usage statistics for a discount.
 *
 * @param {String} discountId - Discount ID
 * @returns {Promise<Object>} - Statistics object
 */
export async function getUsageStats(discountId) {
  try {
    const result = await DiscountUsage.aggregate([
      { $match: { discount: new Types.ObjectId(discountId) } },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: 1 },
          totalAmountSaved: { $sum: "$amountSaved" },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsage: 1,
          totalAmountSaved: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    return (
      result[0] || {
        totalUsage: 0,
        totalAmountSaved: 0,
        uniqueUsers: 0,
      }
    );
  } catch (error) {
    logger.error(
      `[discountUsage.model] Error getting usage stats: ${error.message}`
    );
    throw error;
  }
}
