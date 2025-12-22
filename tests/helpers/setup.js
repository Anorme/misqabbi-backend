import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import Redis from "ioredis-mock";
import { jest } from "@jest/globals";

let mongoServer = null;
let mockRedis = null;

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

export function setupTestRedis() {
  mockRedis = new Redis();

  jest.mock("../../src/services/redis.js", () => {
    return {
      getRedisClient: () => mockRedis,
      closeRedisConnection: async () => {
        if (mockRedis) {
          await mockRedis.quit();
          mockRedis = null;
        }
      },
      default: () => mockRedis,
    };
  });

  return mockRedis;
}

export async function teardownTestRedis() {
  if (mockRedis) {
    await mockRedis.quit();
    mockRedis = null;
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

  // Clear all Redis keys
  if (mockRedis) {
    await mockRedis.flushall();
  }
}

export function getTestRedis() {
  return mockRedis;
}
