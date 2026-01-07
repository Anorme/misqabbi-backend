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
    let client;

    // Use REDIS_URL if provided (for Railway/Render)
    if (env.REDIS_URL) {
      client = new Redis(env.REDIS_URL, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
      logger.info("[redis] Connecting to Redis using REDIS_URL");
    } else {
      // Use host/port configuration (for local development)
      const redisConfig = {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      };
      logger.info(
        `[redis] Connecting to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`
      );
      client = new Redis(redisConfig);
    }

    // Event handlers
    client.on("connect", () => {
      logger.info("[redis] Connected to Redis successfully");
    });

    client.on("error", error => {
      logger.error(`[redis] Redis connection error: ${error.message}`);
    });

    client.on("close", () => {
      logger.warn("[redis] Redis connection closed");
    });

    client.on("reconnecting", () => {
      logger.info("[redis] Reconnecting to Redis...");
    });

    redisClient = client;
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

export default getRedisClient;
