import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer = null;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clean all test databases (MongoDB collections and Redis keys)
 * Useful for resetting state between tests
 */
export async function cleanTestDB() {
  // Clear all MongoDB collections
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  // Clear all Redis keys - get from mocked service
  // Since ioredis is mocked globally, getRedisClient() will return an ioredis-mock instance
  try {
    const { getRedisClient } = await import("../../src/services/redis.js");
    const redisClient = getRedisClient();
    if (redisClient && typeof redisClient.flushall === "function") {
      await redisClient.flushall();
    }
  } catch (error) {
    console.warn("[redis] Failed to flush Redis: ", error.message);
  }
}
