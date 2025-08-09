import passport from "passport";

import logger from "../config/logger.js";
import { createUser, findUserByEmail } from "../models/user.model.js";
import { signToken } from "../services/jwtService.js";

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
      req.user = user;
      return issueToken(req, res);
    } catch (error) {
      logger.error(`[loginUser] User JWT generation failed: ${error.message}`);
      return res.status(500).json({ error: "Token generation error" });
    }
  })(req, res, next);
}

/**
 * @route   GET /auth/google/callback
 * @desc    Finalizes Google OAuth flow and issues token
 * @access  Public
 *
 * Workflow:
 * - Invoked after successful Passport Google authentication
 * - Delegates token generation to `issueToken` helper
 * - Redirects user to frontend with token in query string
 * - Handles errors with structured response and logging
 *
 * @returns {void}
 */
export function handleGoogleCallback(req, res) {
  try {
    issueToken(req, res, { redirectUrl: "http://localhost:3000" });
  } catch (error) {
    logger.error(`[GoogleCallback] Token issuance failed: ${error.message}`);
    res.status(500).json({ error: "OAuth token error" });
  }
}

/**
 * Issues a signed JWT for the authenticated user and returns it via response.
 *
 * Delivery Options:
 * - If `redirectUrl` is provided, redirects to that URL with the token in query params.
 * - Otherwise, sends a JSON response with `{ token }`.
 *
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.redirectUrl] - URL to redirect with token as query param
 * @returns {void}
 */
function issueToken(req, res, options = {}) {
  const token = signToken({ id: req.user._id, role: req.user.role });
  try {
    if (options.redirectUrl) {
      const urlWithToken = new URL(options.redirectUrl);
      urlWithToken.searchParams.set("token", token);
      return res.redirect(urlWithToken.toString());
    }
    res.json({ token });
  } catch (error) {
    logger.error(`[issueToken] Token generation failed: ${error.message}`);
    return res.status(500).json({ error: "Authentication error" });
  }
}

export { registerUser, loginUser };
