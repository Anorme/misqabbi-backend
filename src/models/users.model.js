const User = require("./users.mongo");

/**
 * Create a new user in the database.
 *
 * @param {Object} userData - User details
 * @param {string} userData.email - Unique email address
 * @param {string} userData.password - Plain text password (will be hashed via schema middleware)
 * @param {string} [userData.displayName] - Optional display name
 * @returns {Promise<Object>} - The created user document
 */
async function createUser({ email, password, displayName }) {
  const user = new User({ email, password, displayName });
  return await user.save();
}

/**
 * Find a user by their email address.
 *
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} - User document if found, otherwise null
 */
async function findUserByEmail(email) {
  return await User.findOne({ email });
}

/**
 * Find a user by their MongoDB ObjectId.
 *
 * @param {string|ObjectId} id - User ID
 * @returns {Promise<Object|null>} - User document if found, otherwise null
 */
async function findUserById(id) {
  return await User.findById({ id });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
