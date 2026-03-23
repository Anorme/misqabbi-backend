import { Types } from "mongoose";
import User from "./user.mongo.js";
import logger from "../config/logger.js";

/**
 * Create a new local user.
 *
 * @param {Object} data - User data with shape: { email, password, displayName }
 * @returns {Promise<Object>} - Newly created user document
 * @throws {Error} - If there is an error creating the user
 */
async function createLocalUser({ email, password, displayName }) {
  try {
    const user = new User({ email, password, displayName });
    return await user.save();
  } catch (error) {
    logger.error(`[users.model] Error creating user: ${error.message}`);
    throw error;
  }
}

/**
 * Create a new user with a Google ID.
 *
 * @param {Object} data - User data with shape: { email, googleId, displayName }
 * @returns {Promise<Object>} - Newly created user document
 * @throws {Error} - If there is an error creating the user
 */
async function createGoogleUser({ email, googleId, displayName }) {
  try {
    const user = new User({ email, googleId, displayName });
    return await user.save();
  } catch (error) {
    logger.error(`[users.model] Error creating user: ${error.message}`);
    throw error;
  }
}

/**
 * Create a lightweight guest user for anonymous checkout.
 *
 * @returns {Promise<Object>} - Newly created guest user document
 */
async function createGuestUser() {
  try {
    const user = new User({
      isGuest: true,
      guestLastSeenAt: new Date(),
    });
    return await user.save();
  } catch (error) {
    logger.error(`[users.model] Error creating guest user: ${error.message}`);
    throw error;
  }
}

/**
 * Find a user by their email address.
 *
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} - User document if found, otherwise null
 */
async function findUserByEmail(email) {
  try {
    return await User.findOne({ email });
  } catch (error) {
    logger.error(
      `[users.model] Error finding user by email ${email}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Find a user by their MongoDB ObjectId.
 *
 * - Accepts either a string or a valid ObjectId instance
 * - Returns null if the input is not a valid ObjectId format
 * - Logs a warning for invalid input to aid debugging
 *
 * @param {string|ObjectId} id - User ID to lookup
 * @returns {Promise<Object|null>} - User document if found, otherwise null or throws on DB error
 */
async function findUserById(id) {
  try {
    if (typeof id !== "string" && !Types.ObjectId.isValid(id)) {
      logger.warn(`[users.model] Invalid ID format: ${id}`);
      return null;
    }
    return await User.findById(id);
  } catch (error) {
    logger.error(
      `[users.model] Error finding user by id ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Find an active (unmerged) guest user by ID.
 *
 * @param {string|ObjectId} id - Guest user ID
 * @returns {Promise<Object|null>} - Guest user or null
 */
async function findActiveGuestUserById(id) {
  try {
    if (typeof id !== "string" && !Types.ObjectId.isValid(id)) {
      logger.warn(`[users.model] Invalid guest ID format: ${id}`);
      return null;
    }
    return await User.findOne({
      _id: id,
      isGuest: true,
      guestMergedInto: null,
    });
  } catch (error) {
    logger.error(
      `[users.model] Error finding active guest by id ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Touch guest activity timestamp.
 *
 * @param {string|ObjectId} guestUserId - Guest user ID
 * @returns {Promise<Object|null>} - Updated guest document or null
 */
async function touchGuestLastSeen(guestUserId) {
  try {
    if (!Types.ObjectId.isValid(guestUserId)) return null;
    return await User.findOneAndUpdate(
      { _id: guestUserId, isGuest: true, guestMergedInto: null },
      { guestLastSeenAt: new Date() },
      { new: true }
    );
  } catch (error) {
    logger.error(
      `[users.model] Error touching guest last seen ${guestUserId}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Deletes stale unmerged guest users inactive before provided cutoff.
 *
 * @param {Date} cutoffDate - Guests last seen before this date are deleted
 * @returns {Promise<number>} - Number of deleted guests
 */
async function deleteStaleGuests(cutoffDate) {
  try {
    const result = await User.deleteMany({
      isGuest: true,
      guestMergedInto: null,
      $or: [
        { guestLastSeenAt: { $lt: cutoffDate } },
        { guestLastSeenAt: null, createdAt: { $lt: cutoffDate } },
      ],
    });
    return result?.deletedCount || 0;
  } catch (error) {
    logger.error(`[users.model] Error deleting stale guests: ${error.message}`);
    throw error;
  }
}

export {
  createLocalUser,
  createGoogleUser,
  createGuestUser,
  findUserByEmail,
  findUserById,
  findActiveGuestUserById,
  touchGuestLastSeen,
  deleteStaleGuests,
};

// Admin listing helpers
export async function getPaginatedUsers(page = 1, limit = 10, params = {}) {
  try {
    const skip = (page - 1) * limit;
    const { q } = params;
    const filter = {};
    const projection = {};
    const sort = { createdAt: -1 };
    if (q && typeof q === "string") {
      filter.$text = { $search: q };
      projection.score = { $meta: "textScore" };
      // Sort primarily by text score, then by recency
      sort.score = { $meta: "textScore" };
    }
    return await User.find(filter, projection)
      .select("email displayName name role createdAt score")
      .sort(sort)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    logger.error(`[users.model] Error getting users: ${error.message}`);
    throw error;
  }
}

export async function countUsers(params = {}) {
  try {
    const { q } = params;
    const filter = q && typeof q === "string" ? { $text: { $search: q } } : {};
    return await User.countDocuments(filter);
  } catch (error) {
    logger.error(`[users.model] Error counting users: ${error.message}`);
    throw error;
  }
}

export async function countAllUsers() {
  try {
    return await User.countDocuments({});
  } catch (error) {
    logger.error(`[users.model] Error counting all users: ${error.message}`);
    throw error;
  }
}

export async function deleteUserById(userId) {
  try {
    if (!Types.ObjectId.isValid(userId)) return null;
    return await User.findByIdAndDelete(userId);
  } catch (error) {
    logger.error(
      `[users.model] Error deleting user ${userId}: ${error.message}`
    );
    throw error;
  }
}

export async function updateUserRole(userId, role) {
  try {
    if (!Types.ObjectId.isValid(userId)) return null;
    return await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("email displayName name role createdAt");
  } catch (error) {
    logger.error(
      `[users.model] Error updating user role ${userId}: ${error.message}`
    );
    throw error;
  }
}
