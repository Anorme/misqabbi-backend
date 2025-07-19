const passport = require("passport");

const logger = require("../config/logger");
const { createUser, findUserByEmail } = require("../models/users.model");
const { signToken } = require("../services/jwtService");

/**
 * @route   POST /signup
 * @desc    Registers a new user with email, password, and optional displayName
 * @access  Public
 *
 * Workflow:
 * - Checks for an existing user via email lookup
 * - Delegates password hashing to Mongoose pre-save middleware
 * - Validates input via Mongoose schema before save
 * - Logs lifecycle events and errors using Winston
 * - Responds with newly created user ID or a generic error message
 */

async function registerUser(req, res) {
  const { email, password, displayName } = req.body;
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      logger.warn(`[registerUser] Email already exists: ${email}`);
      return res.status(400).json({ message: "Invalid user credentials" });
    }
    const user = await createUser({ email, password, displayName });
    logger.info(`[registerUser] Created user: ${user._id}`);
    res.status(201).json({ message: "User created", userId: user._id });
  } catch (error) {
    logger.error(`[registerUser] ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * @route   POST /login
 * @desc    Authenticates a user and issues a signed JWT
 * @access  Public
 *
 * Workflow:
 * - Invokes Passport Local Strategy with a custom callback
 * - Validates credentials via schema-defined comparePassword method
 * - On success, generates JWT with user ID and role as payload
 * - Logs outcome and returns token for client-side usage
 * - Gracefully handles failures and token generation errors
 */
async function loginUser(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      logger.warn(`[loginUser] Login failed: ${info?.message || err.message}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
      const token = signToken({ id: user._id, role: user.role });

      logger.info(`[loginUser] User logged in: ${user._id}`);
      res.json({ token });
    } catch (error) {
      logger.error(`[loginUser] User JWT generation failed: ${error.message}`);
      return res.status(500).json({ error: "Token generation error" });
    }
  })(req, res, next);
}

module.exports = {
  registerUser,
  loginUser,
};
