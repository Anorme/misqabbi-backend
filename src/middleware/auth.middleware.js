import { verifyToken } from "../services/jwtService.js";
import { verifyGuestToken } from "../services/jwtService.js";
import {
  findUserById,
  findActiveGuestUserById,
  touchGuestLastSeen,
} from "../models/user.model.js";
import {
  getAccessTokenCookieOptions,
  getGuestTokenCookieOptions,
} from "../utils/getCookieOptions.js";
import logger from "../config/logger.js";

/**
 * Verifies the presence and validity of an authentication token
 * sent in a cookie, and if valid, populates `req.user` with the
 * corresponding user document. Automatically clears invalid/expired
 * cookies to maintain consistent authentication state.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {401} if no token is present, or if the user is not found
 * @throws {403} if the token is invalid or expired
 */
async function authenticateToken(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    logger.warn("[auth.middleware] Missing token cookie");
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = verifyToken(token);

    const user = await findUserById(decoded.id);
    if (!user) {
      // Clear invalid cookie when user not found
      res.clearCookie("auth_token", getAccessTokenCookieOptions());
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error(
      `[auth.middleware] Token verification failed: ${error.message}`
    );
    // Clear invalid/expired cookie
    res.clearCookie("auth_token", getAccessTokenCookieOptions());
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

/**
 * Resolves request principal as either authenticated user or guest user.
 * - Prefers authenticated user token when present and valid.
 * - Falls back to guest token for anonymous checkout-capable flows.
 */
async function authenticateOptionalPrincipal(req, res, next) {
  const authToken = req.cookies?.auth_token;
  const guestToken = req.cookies?.guest_token;

  if (authToken) {
    try {
      const decoded = verifyToken(authToken);
      const user = await findUserById(decoded.id);
      if (user) {
        req.user = user;
        req.principal = { type: "user", _id: user._id, user };
        return next();
      }
      res.clearCookie("auth_token", getAccessTokenCookieOptions());
    } catch (error) {
      logger.warn(
        `[auth.middleware] Optional principal auth token invalid: ${error.message}`
      );
      res.clearCookie("auth_token", getAccessTokenCookieOptions());
    }
  }

  if (guestToken) {
    try {
      const decodedGuest = verifyGuestToken(guestToken);
      const guest = await findActiveGuestUserById(decodedGuest.id);
      if (guest) {
        await touchGuestLastSeen(guest._id);
        req.principal = { type: "guest", _id: guest._id, user: guest };
        return next();
      }
      res.clearCookie("guest_token", getGuestTokenCookieOptions());
    } catch (error) {
      logger.warn(
        `[auth.middleware] Optional principal guest token invalid: ${error.message}`
      );
      res.clearCookie("guest_token", getGuestTokenCookieOptions());
    }
  }

  return res
    .status(401)
    .json({ message: "Authentication or guest session required" });
}

/**
 * Middleware to restrict access to admin-only routes.
 *
 * Assumes req.user is populated by authentication middleware
 *
 * @throws {403} If user lacks admin privileges
 */
function checkAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Access denied: Admins only!" });
  next();
}

export { authenticateToken, authenticateOptionalPrincipal, checkAdmin };
