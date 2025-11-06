import env from "../config/env.js";

import crypto from "crypto";
import passport from "passport";

import logger from "../config/logger.js";
import { signAccessToken } from "../services/jwtService.js";
import { renderView } from "../services/viewService.js";
import { sendEmail } from "../services/emailService.js";
import {
  generateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
} from "../services/refreshTokenService.js";

import { formatResponse } from "../utils/responseFormatter.js";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/getCookieOptions.js";

import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  getPaginatedUsers,
  countUsers,
  deleteUserById,
  updateUserRole,
} from "../models/user.model.js";
import ResetToken from "../models/resetToken.mongo.js";

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
    finalizeAuth(req, res);
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
          contact: user?.contact,
          location: user?.location,
          profileComplete: user?.profileComplete,
          role: user?.role,
        },
      },
    })
  );
}

/**
 * Helper function to finalize authentication workflow
 * - Generates both access token (15 min) and refresh token (7 days)
 * - Stores refresh token in Redis with TTL
 * - Sets both tokens as HTTP-only cookies with appropriate paths
 * - Redirects to intermediate success page for Safari cookie persistence
 * - Works for both OAuth (Google) and local auth (login/register via form submission)
 * - Handles errors with structured response and logging
 *
 * @param {Object} req   - Express request object
 * @param {Object} res   - Express response object
 * @returns {void}
 */
async function finalizeAuth(req, res) {
  try {
    // Generate tokens
    const accessToken = signAccessToken({
      id: req.user._id,
      role: req.user.role,
    });
    const refreshToken = generateRefreshToken();

    // Store refresh token in Redis
    const refreshTokenStored = await storeRefreshToken(
      req.user._id.toString(),
      refreshToken,
      Number(env.REFRESH_TOKEN_EXPIRES_IN)
    );

    if (!refreshTokenStored) {
      throw new Error("Failed to store refresh token");
    }

    // Get cookie options
    const accessTokenCookieOptions = getAccessTokenCookieOptions();
    const refreshTokenCookieOptions = getRefreshTokenCookieOptions();

    // Set both cookies
    res.cookie("auth_token", accessToken, accessTokenCookieOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenCookieOptions);

    // Redirect to intermediate success page on backend domain
    // This allows Safari to persist cookies before cross-origin redirect
    // Works for both Google OAuth and local auth (form submission)
    const intermediateUrl = `${env.BASE_URL}${env.API_PREFIX}/auth/success`;
    return res.redirect(intermediateUrl);
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
 * @route   GET /auth/success
 * @desc    Intermediate success page for authentication
 * @access  Public
 *
 * Serves an HTML page that allows Safari to persist cookies before
 * redirecting to the frontend. This works around Safari's ITP restrictions
 * on cookies set during cross-origin redirects.
 */
export function handleAuthSuccess(req, res) {
  try {
    const html = renderView("auth-success");

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (error) {
    logger.error(`[handleAuthSuccess] Error rendering view: ${error.message}`);
    res.status(500).send("Internal server error");
  }
}

/**
 * Logs out the currently authenticated user by clearing both authentication cookies
 * and revoking the refresh token from Redis.
 * @function logoutUser
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a JSON response with a success message and clears both cookies
 */
export const logoutUser = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refresh_token;

    // Revoke refresh token from Redis if it exists
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Clear both cookies
    res.clearCookie("auth_token", getAccessTokenCookieOptions());
    res.clearCookie("refresh_token", getRefreshTokenCookieOptions());

    return res.status(200).json(
      formatResponse({
        message: "User logged out successfully",
      })
    );
  } catch (error) {
    logger.error(`[logoutUser] Error during logout: ${error.message}`);
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Logout failed",
        error: "Internal server error",
      })
    );
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /auth/refresh
 * @desc Refresh access token with refresh token
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} New access token and rotated refresh token
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      logger.warn("[refreshAccessToken] No refresh token provided");
      return res.status(401).json(
        formatResponse({
          success: false,
          message: "Refresh token required",
        })
      );
    }

    // Validate refresh token
    const tokenData = await validateRefreshToken(refreshToken);

    if (!tokenData) {
      logger.warn("[refreshAccessToken] Invalid refresh token");
      return res.status(401).json(
        formatResponse({
          success: false,
          message: "Invalid refresh token",
        })
      );
    }

    // Get user data
    const user = await findUserById(tokenData.userId);

    if (!user) {
      logger.warn(`[refreshAccessToken] User not found: ${tokenData.userId}`);
      return res.status(401).json(
        formatResponse({
          success: false,
          message: "User not found",
        })
      );
    }

    // Generate new tokens (token rotation)
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken();

    // Store new refresh token and revoke old one
    const refreshTokenStored = await storeRefreshToken(
      user._id.toString(),
      newRefreshToken,
      Number(env.REFRESH_TOKEN_EXPIRES_IN)
    );

    if (!refreshTokenStored) {
      throw new Error("Failed to store new refresh token");
    }

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Get cookie options
    const accessTokenCookieOptions = getAccessTokenCookieOptions();
    const refreshTokenCookieOptions = getRefreshTokenCookieOptions();

    // Set new cookies
    res.cookie("auth_token", newAccessToken, accessTokenCookieOptions);
    res.cookie("refresh_token", newRefreshToken, refreshTokenCookieOptions);

    const userData = {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      contact: user?.contact,
      location: user?.location,
      profileComplete: user?.profileComplete,
    };

    logger.info(`[refreshAccessToken] Tokens refreshed for user ${user._id}`);

    return res.status(200).json(
      formatResponse({
        message: "Tokens refreshed successfully",
        data: { user: userData },
      })
    );
  } catch (error) {
    logger.error(
      `[refreshAccessToken] Error refreshing tokens: ${error.message}`
    );
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Token refresh failed",
        error: "Internal server error",
      })
    );
  }
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

export async function getUsersAdmin(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const q = req.query.q?.trim();
    const [users, total] = await Promise.all([
      getPaginatedUsers(page, limit, { q }),
      countUsers({ q }),
    ]);
    return res.status(200).json(
      formatResponse({
        data: users,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    logger.error(`[users.controller] Failed to list users: ${error.message}`);
    return res
      .status(500)
      .json(formatResponse({ success: false, error: "Failed to load users" }));
  }
}

export async function deleteUserByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json(formatResponse({ success: false, error: "Invalid user id" }));
    }
    const deleted = await deleteUserById(id);
    if (!deleted) {
      return res
        .status(404)
        .json(formatResponse({ success: false, error: "User not found" }));
    }
    return res
      .status(200)
      .json(
        formatResponse({ message: "User deleted successfully", data: { id } })
      );
  } catch (error) {
    logger.error(`[users.controller] Failed to delete user: ${error.message}`);
    return res
      .status(500)
      .json(formatResponse({ success: false, error: "Failed to delete user" }));
  }
}

export async function updateUserRoleAdmin(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!id) {
      return res
        .status(400)
        .json(formatResponse({ success: false, error: "Invalid user id" }));
    }
    const allowed = ["user", "admin"];
    if (!allowed.includes(role)) {
      return res
        .status(400)
        .json(
          formatResponse({ success: false, error: "Invalid role supplied" })
        );
    }
    const updated = await updateUserRole(id, role);
    if (!updated) {
      return res
        .status(404)
        .json(formatResponse({ success: false, error: "User not found" }));
    }
    return res.status(200).json(formatResponse({ data: updated }));
  } catch (error) {
    logger.error(`[users.controller] Failed to update role: ${error.message}`);
    return res
      .status(500)
      .json(formatResponse({ success: false, error: "Failed to update role" }));
  }
}

export const updateUserProfile = async (req, res) => {
  const userId = req.user._id;
  const { contact, location, email } = req.body;
  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json(
        formatResponse({
          success: false,
          message: "User not found",
        })
      );
    }
    user.email = email || user.email;
    user.contact = contact || user.contact;
    user.location = location || user.location;

    user.profileComplete = Boolean(user.contact && user.location);

    await user.save();
    res.json(
      formatResponse({
        message: "Profile updated successfully",
        data: {
          user: {
            userId: user._id,
            email: user.email,
            contact: user.contact,
            location: user.location,
            profileComplete: user.profileComplete,
          },
        },
      })
    );
  } catch (error) {
    logger.error(`[updateUserProfile] ${error.message}`);
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Internal server error",
      })
    );
  }
};
