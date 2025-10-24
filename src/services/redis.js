import Redis from "ioredis";
import env from "../config/env.js";
import logger from "../config/logger.js";

let redisClient = null;

/**
 * Initialize Redis client with environment-aware configuration
 * Supports both local (host/port) and remote (URL) connections
 * @returns {Redis} Redis client instance
 */
function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    let redisConfig;

    // Use REDIS_URL if provided (for Railway/Render)
    if (env.REDIS_URL) {
      redisConfig = {
        url: env.REDIS_URL,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      };
      logger.info("[redis] Connecting to Redis using REDIS_URL");
    } else {
      // Use host/port configuration (for local development)
      redisConfig = {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      };
      logger.info(
        `[redis] Connecting to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`
      );
    }

    redisClient = new Redis(redisConfig);

    // Event handlers
    redisClient.on("connect", () => {
      logger.info("[redis] Connected to Redis successfully");
    });

    redisClient.on("error", error => {
      logger.error(`[redis] Redis connection error: ${error.message}`);
    });

    redisClient.on("close", () => {
      logger.warn("[redis] Redis connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("[redis] Reconnecting to Redis...");
    });

    return redisClient;
  } catch (error) {
    logger.error(`[redis] Failed to initialize Redis: ${error.message}`);
    throw error;
  }
}

/**
 * Get Redis client instance
 * @returns {Redis} Redis client instance
 */
export function getRedisClient() {
  if (!redisClient) {
    return initializeRedis();
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("[redis] Redis connection closed");
  }
}

// Initialize Redis on module load
initializeRedis();

export default getRedisClient;
