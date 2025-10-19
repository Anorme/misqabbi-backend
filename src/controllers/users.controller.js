import env from "../config/env.js";

import passport from "passport";

import logger from "../config/logger.js";
import { signToken } from "../services/jwtService.js";
import getCookieOptions from "../utils/getCookieOptions.js";
import { formatResponse } from "../utils/responseFormatter.js";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
} from "../models/user.model.js";
import crypto from "crypto";
import ResetToken from "../models/resetToken.mongo.js";
import { sendEmail } from "../services/emailService.js";
import { PASSWORD_RESET_EMAIL } from "../constants/emailTemplates.js";

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

export async function registerUser(req, res) {
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
    const user = await createLocalUser({ email, password, displayName });
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
export async function loginUser(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      logger.warn(`[loginUser] Login failed: ${info?.message || err.message}`);
      return res.status(401).json(
        formatResponse({
          success: false,
          message: "Invalid credentials",
        })
      );
    }

    try {
      req.user = user;
      return finalizeAuth(req, res);
    } catch (error) {
      logger.error(`[loginUser] User JWT generation failed: ${error.message}`);
      return res.status(500).json(
        formatResponse({
          success: false,
          error: "Token generation error",
        })
      );
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
 * @route   GET /me
 * @desc    Retrieves the currently authenticated user
 * @access  Private
 *
 * Workflow:
 * - Retrieves the user object from the request
 * - Validates the user object
 * - Returns the user object in a standardized format
 * - Handles unauthorized access with a 401 response
 *
 * @returns {Promise<Object>} User data in a standardized format
 */
export async function getCurrentUser(req, res) {
  const user = req.user;

  if (!user) {
    return res.status(401).json(
      formatResponse({
        success: false,
        message: "User not authenticated",
      })
    );
  }

  return res.status(200).json(
    formatResponse({
      message: "Authenticated user retrieved successfully",
      data: {
        user: {
          userId: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      },
    })
  );
}

/**
 * Helper function to finalize authentication workflow
 * - Generates a JWT with user ID and role as payload
 * - Sets an http-only cookie with the token with environment aware options
 * - Returns a JSON response with basic user data and logs the token in development
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

  const cookieOptions = getCookieOptions();

  const user = {
    userId: req.user._id,
    email: req.user.email,
    displayName: req.user.displayName,
  };

  const isDev = env.NODE_ENV === "development";

  try {
    res.cookie("auth_token", token, cookieOptions);

    if (options.redirectUrl) {
      return res.redirect(options.redirectUrl);
    }

    if (isDev) logger.info(`[finalizeAuth] Token issued: ${token}`);

    return res.status(200).json(
      formatResponse({
        message: "User authenticated successfully",
        data: { user },
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

/**
 * Logs out the currently authenticated user by clearing the authentication token cookie.
 * @function logoutUser
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a JSON response with a success message and clears the authentication token cookie
 */
export const logoutUser = (req, res) => {
  res.clearCookie("auth_token", getCookieOptions());
  return res.status(200).json(
    formatResponse({
      message: "User logged out successfully",
    })
  );
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      logger.warn(
        `[forgotPassword] Password reset requested for non-existent email: ${email}`
      );
      return res.json(
        formatResponse({
          success: false,
          message: "Email not found. Please check your email address.",
        })
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    logger.info(`[forgotPassword] Generated reset token for user ${user._id}`);

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    logger.info(`[forgotPassword] Hashed reset token for storage`);

    await ResetToken.deleteMany({ userId: user._id });

    await ResetToken.create({
      userId: user._id,
      token: hashedToken,
    });

    const resetUrl = `${env.BASE_URL}/reset-password/${user._id}/${rawToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      PASSWORD_RESET_EMAIL(resetUrl)
    );

    return res.json(
      formatResponse({
        message: "Password reset link sent successfully",
      })
    );
  } catch (error) {
    logger.error(`[forgotPassword] Error: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        error: "Server error",
      })
    );
  }
};

export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetTokenDoc = await ResetToken.findOne({
      userId,
      token: hashedToken,
    });

    if (!resetTokenDoc) {
      logger.warn(
        `[resetPassword] Invalid or expired reset token for user ${userId}`
      );
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Invalid or expired token",
        })
      );
    }

    const user = await findUserById(userId);
    if (!user) {
      logger.warn(`[resetPassword] No user found for ID ${userId}`);
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Invalid user",
        })
      );
    }

    user.password = newPassword;
    await user.save();

    await ResetToken.deleteMany({ userId });

    logger.info(`[resetPassword] Password reset successful for user ${userId}`);
    return res.json(
      formatResponse({
        success: true,
        message: "Password has been reset successfully",
      })
    );
  } catch (error) {
    logger.error(`[resetPassword] Error: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        error: "Server error",
      })
    );
  }
};

export const updateUserProfile = async (req, res) => {
  const userId = req.user._id;
  const { contact, location, email } = req.body;
  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.email = email || user.email;
    user.contact = contact || user.contact;
    user.location = location || user.location;

    user.profileComplete = Boolean(user.contact && user.location);

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: {
        email: user.email,
        contact: user.contact,
        location: user.location,
        profileComplete: user.profileComplete,
      },
    });
  } catch (error) {
    logger.error(`[updateUserProfile] ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};
