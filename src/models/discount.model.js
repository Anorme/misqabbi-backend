import { Types } from "mongoose";
import Discount from "./discount.mongo.js";
import logger from "../config/logger.js";

/**
 * Create a new discount code.
 *
 * @param {Object} discountData - Discount data
 * @param {String} adminId - ID of the admin creating the discount
 * @returns {Promise<Object>} - Newly created discount document
 */
export async function createDiscount(discountData, adminId) {
  try {
    const discount = new Discount({
      ...discountData,
      createdBy: adminId,
    });
    return await discount.save();
  } catch (error) {
    logger.error(`[discount.model] Error creating discount: ${error.message}`);
    throw error;
  }
}

/**
 * Find a discount by its code.
 *
 * @param {String} code - Discount code to search for
 * @returns {Promise<Object|null>} - Discount document if found
 */
export async function findDiscountByCode(code) {
  try {
    return await Discount.findOne({ code: code.toUpperCase().trim() });
  } catch (error) {
    logger.error(
      `[discount.model] Error finding discount by code: ${error.message}`
    );
    throw error;
  }
}

/**
 * Find a discount by its ID.
 *
 * @param {String} id - Discount ID
 * @returns {Promise<Object|null>} - Discount document if found
 */
export async function findDiscountById(id) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      logger.warn(`[discount.model] Invalid discount ID format: ${id}`);
      return null;
    }
    return await Discount.findById(id);
  } catch (error) {
    logger.error(
      `[discount.model] Error finding discount by ID: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get paginated list of discounts with optional filters.
 *
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} limit - Items per page
 * @param {Object} params - Filter parameters
 * @returns {Promise<Array>} - Array of discount documents
 */
export async function getPaginatedDiscounts(page = 1, limit = 10, params = {}) {
  try {
    const skip = (page - 1) * limit;
    const filter = {};
    const sort = { createdAt: -1 };

    // Filter by active status
    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    // Filter by scope
    if (params.scope) {
      filter.scope = params.scope;
    }

    // Filter by usage type
    if (params.usageType) {
      filter.usageType = params.usageType;
    }

    // Filter by expiry status
    if (params.expired === true) {
      filter.expiryDate = { $lt: new Date() };
    } else if (params.expired === false) {
      filter.expiryDate = { $gte: new Date() };
    }

    // Text search
    if (params.q && typeof params.q === "string") {
      filter.$text = { $search: params.q };
      sort.score = { $meta: "textScore" };
    }

    return await Discount.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "createdBy", select: "displayName email" });
  } catch (error) {
    logger.error(
      `[discount.model] Error getting paginated discounts: ${error.message}`
    );
    throw error;
  }
}

/**
 * Count discounts with optional filters.
 *
 * @param {Object} params - Filter parameters
 * @returns {Promise<Number>} - Count of matching discounts
 */
export async function countDiscounts(params = {}) {
  try {
    const filter = {};

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive;
    }

    if (params.scope) {
      filter.scope = params.scope;
    }

    if (params.usageType) {
      filter.usageType = params.usageType;
    }

    if (params.expired === true) {
      filter.expiryDate = { $lt: new Date() };
    } else if (params.expired === false) {
      filter.expiryDate = { $gte: new Date() };
    }

    if (params.q && typeof params.q === "string") {
      filter.$text = { $search: params.q };
    }

    return await Discount.countDocuments(filter);
  } catch (error) {
    logger.error(`[discount.model] Error counting discounts: ${error.message}`);
    throw error;
  }
}

/**
 * Update a discount by ID.
 * Note: The code field cannot be changed after creation.
 *
 * @param {String} id - Discount ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object|null>} - Updated discount document
 */
export async function updateDiscount(id, updateData) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Prevent changing the code
    delete updateData.code;
    // Prevent changing createdBy
    delete updateData.createdBy;
    // Prevent directly setting currentGlobalUses
    delete updateData.currentGlobalUses;

    return await Discount.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    logger.error(
      `[discount.model] Error updating discount ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Soft delete a discount by setting isActive to false.
 *
 * @param {String} id - Discount ID
 * @returns {Promise<Object|null>} - Updated discount document
 */
export async function deactivateDiscount(id) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return await Discount.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  } catch (error) {
    logger.error(
      `[discount.model] Error deactivating discount ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Increment the global usage count for a discount.
 * Uses atomic operation to prevent race conditions.
 *
 * @param {String} discountId - Discount ID
 * @param {Object} session - MongoDB session for transactions
 * @returns {Promise<Object>} - Updated discount document
 */
export async function incrementDiscountUsage(discountId, session = null) {
  try {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    return await Discount.findByIdAndUpdate(
      discountId,
      { $inc: { currentGlobalUses: 1 } },
      options
    );
  } catch (error) {
    logger.error(
      `[discount.model] Error incrementing discount usage: ${error.message}`
    );
    throw error;
  }
}

/**
 * Check if a discount code already exists.
 *
 * @param {String} code - Code to check
 * @returns {Promise<Boolean>} - True if code exists
 */
export async function codeExists(code) {
  try {
    const count = await Discount.countDocuments({
      code: code.toUpperCase().trim(),
    });
    return count > 0;
  } catch (error) {
    logger.error(
      `[discount.model] Error checking code existence: ${error.message}`
    );
    throw error;
  }
}

/**
 * Get discount statistics for admin dashboard.
 *
 * @returns {Promise<Object>} - Statistics object
 */
export async function getDiscountStats() {
  try {
    const now = new Date();

    const [total, active, expired, totalUsage] = await Promise.all([
      Discount.countDocuments({}),
      Discount.countDocuments({ isActive: true, expiryDate: { $gte: now } }),
      Discount.countDocuments({
        $or: [{ isActive: false }, { expiryDate: { $lt: now } }],
      }),
      Discount.aggregate([
        { $group: { _id: null, totalUsage: { $sum: "$currentGlobalUses" } } },
      ]),
    ]);

    return {
      total,
      active,
      expired,
      totalUsage: totalUsage[0]?.totalUsage || 0,
    };
  } catch (error) {
    logger.error(
      `[discount.model] Error getting discount stats: ${error.message}`
    );
    throw error;
  }
}
