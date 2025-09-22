import { verifyToken } from "../services/jwtService.js";
import { findUserById } from "../models/user.model.js";
import logger from "../config/logger.js";

/**
 * Verifies the presence and validity of an authentication token
 * sent in a cookie, and if valid, populates `req.user` with the
 * corresponding user document.
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
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (error) {
    logger.error(
      `[auth.middleware] Token verification failed: ${error.message}`
    );
    return res.status(403).json({ message: "Invalid or expired token" });
  }
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

export { authenticateToken, checkAdmin };
