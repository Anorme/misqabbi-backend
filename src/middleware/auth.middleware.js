const jwt = require("jsonwebtoken");
const { findUserById } = require("../models/users.model");

/**
 * Middleware to verify JWT token from Authorization header.
 *
 * - Expects header format: 'Bearer <token>'
 * - Decodes and verifies token using JWT secret
 * - Fetches user from database using decoded ID
 * - Attaches full user object to req.user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @throws {401} If token is missing or user not found
 * @throws {403} If token is invalid or expired
 *
 * @note Consider limiting selected fields from user document for performance
 * @note Replace console.error with structured logging in production
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or malformed Authorization header" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (error) {
    // TODO: Replace with structured logging in production
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

/**
 * Middleware to restrict access to admin-only routes.
 *
 * - Assumes req.user is already populated by verifyToken
 * - Checks if user's role is 'admin'
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 *
 * @throws {403} If user is not an admin
 */
function checkAdmin(req, res, next) {
  const role = req.user?.role;

  if (role !== "admin")
    return res.status(403).json({ message: "Access denied: Admins only!" });
  next();
}

module.exports = { verifyToken, checkAdmin };
