import { verifyToken } from "../services/jwtService.js";
import { findUserById } from "../models/users.model.js";
import logger from "../config/logger.js";

/**
 * Auth middleware to validate JWT from Authorization header.
 *
 * Expected format: 'Bearer <token>'
 * Attaches verified user to req.user
 *
 * @throws {401} If token is missing or malformed
 * @throws {403} If token is invalid or expired
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("[auth.middleware] Missing or malformed Authorization header");
    return res
      .status(401)
      .json({ message: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

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
