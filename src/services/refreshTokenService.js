import crypto from "crypto";
import { getRedisClient } from "./redis.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

/**
 * Generate a cryptographically secure refresh token
 * @returns {string} Random refresh token
 */
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Store refresh token in Redis with TTL
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function storeRefreshToken(userId, token, expiresIn) {
  try {
    const redis = getRedisClient();
    const key = `refresh_token:${token}`;

    const tokenData = {
      userId,
      createdAt: new Date().toISOString(),
    };

    // Store with TTL (expiresIn seconds)
    await redis.setex(key, expiresIn, JSON.stringify(tokenData));

    logger.info(`[refreshToken] Stored refresh token for user ${userId}`);
    return true;
  } catch (error) {
    logger.error(
      `[refreshToken] Error storing refresh token: ${error.message}`
    );
    return false;
  }
}

/**
 * Validate refresh token and return user data
 * @param {string} token - Refresh token to validate
 * @returns {Promise<Object|null>} User data if valid, null if invalid
 */
export async function validateRefreshToken(token) {
  try {
    const redis = getRedisClient();
    const key = `refresh_token:${token}`;

    const tokenData = await redis.get(key);

    if (!tokenData) {
      logger.warn(`[refreshToken] Refresh token not found: ${token}`);
      return null;
    }

    const parsedData = JSON.parse(tokenData);

    // Update last used timestamp
    parsedData.lastUsed = new Date().toISOString();
    await redis.setex(
      key,
      env.REFRESH_TOKEN_EXPIRES_IN,
      JSON.stringify(parsedData)
    );

    logger.info(
      `[refreshToken] Valid refresh token for user ${parsedData.userId}`
    );
    return parsedData;
  } catch (error) {
    logger.error(
      `[refreshToken] Error validating refresh token: ${error.message}`
    );
    return null;
  }
}

/**
 * Revoke a specific refresh token
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<boolean>} Success status
 */
export async function revokeRefreshToken(token) {
  try {
    const redis = getRedisClient();
    const key = `refresh_token:${token}`;

    const result = await redis.del(key);

    if (result > 0) {
      logger.info(`[refreshToken] Revoked refresh token: ${token}`);
      return true;
    } else {
      logger.warn(
        `[refreshToken] Refresh token not found for revocation: ${token}`
      );
      return false;
    }
  } catch (error) {
    logger.error(
      `[refreshToken] Error revoking refresh token: ${error.message}`
    );
    return false;
  }
}
