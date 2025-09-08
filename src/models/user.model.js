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

export { createLocalUser, createGoogleUser, findUserByEmail, findUserById };
