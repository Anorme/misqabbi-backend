import { Types } from "mongoose";
import User from "./users.mongo.js";
import logger from "../config/logger.js";

/**
 * Create a new user in the database.
 *
 * @param {Object} userData - User details
 * @param {string} userData.email - Unique email address
 * @param {string} userData.password - Plain text password (will be hashed via schema middleware)
 * @param {string} [userData.displayName] - Optional display name
 * @returns {Promise<Object|null>} - The created user document
 */
async function createUser({ email, password, displayName }) {
  try {
    const user = new User({ email, password, displayName });
    return await user.save();
  } catch (error) {
    logger.error(`[users.model] Error creating user: ${error.message}`);
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

export { createUser, findUserByEmail, findUserById };
