import env from "../config/env.js";

import passport from "passport";

import logger from "../config/logger.js";
import { signToken } from "../services/jwtService.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { createUser, findUserByEmail } from "../models/user.model.js";

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
      return res.status(400).json(
        formatResponse({
          success: false,
          message: "Invalid user credentials",
        })
      );
    }
    const user = await createUser({ email, password, displayName });
    req.user = user;
    return finalizeAuth(req, res);
  } catch (error) {
    logger.error(`[registerUser] ${error.message}`);
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to register user",
      })
    );
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
      return finalizeAuth(req, res);
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
 * - Delegates token generation to `finalizeAuth` helper
 * - Redirects user to frontend with token in query string
 * - Handles errors with structured response and logging
 *
 * @returns {void}
 */
export function handleGoogleCallback(req, res) {
  try {
    finalizeAuth(req, res, { redirectUrl: env.GOOGLE_REDIRECT_URL });
  } catch (error) {
    logger.error(`[GoogleCallback] Token issuance failed: ${error.message}`);
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to issue token",
        error: "OAuth token error",
      })
    );
  }
}

/**
 * Helper function to finalize authentication workflow
 * - Generates a JWT with user ID and role as payload
 * - In production, sends an http-only cookie with the token
 * - In development, returns a JSON response with the token and basic user data
 * - Handles errors with structured response and logging
 *
 * @param {Object} req   - Express request object
 * @param {Object} res   - Express response object
 * @param {Object} [options] - Optional configuration object
 * @param {String} [options.redirectUrl] - Redirect URL for production; defaults to false
 * @returns {void}
 */
function finalizeAuth(req, res, options = {}) {
  const token = signToken({ id: req.user._id, role: req.user.role });

  const isProdlike =
    env.NODE_ENV === "production" || env.NODE_ENV === "staging";
  const isDev = env.NODE_ENV === "development";

  const cookieOptions = {
    httpOnly: true,
    secure: isProdlike,
    sameSite: "none",
    domain: ".misqabbi.com",
    maxAge: 8 * 60 * 60 * 1000,
  };

  const user = {
    userId: req.user._id,
    email: req.user.email,
    displayName: req.user.displayName,
  };

  try {
    if (isProdlike) {
      res.cookie("auth_token", token, cookieOptions);

      // If redirectUrl is provided, redirect without sending JSON
      if (options.redirectUrl) {
        return res.redirect(options.redirectUrl);
      }

      // Otherwise, return basic user data
      return res.status(200).json(
        formatResponse({
          message: "Token delivered successfully",
          data: { user },
        })
      );
    }

    // In development, return token and user data
    if (isDev) {
      return res.status(200).json(
        formatResponse({
          message: "Token delivered successfully",
          data: { token, user },
        })
      );
    }

    // Fallback for unexpected env
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Unrecognized environment",
        error: "Authentication error",
      })
    );
  } catch (error) {
    logger.error(`[finalizeAuth] Token delivery failed: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to issue token",
        error: "Authentication error",
      })
    );
  }
}

export { registerUser, loginUser };
