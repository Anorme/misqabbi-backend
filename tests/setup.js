import { jest } from "@jest/globals";
import RedisMock from "ioredis-mock";

// Mock ioredis at the library level - this runs BEFORE all test files
// When redis.js does: import Redis from "ioredis", it gets ioredis-mock instead
// This is hoisted by Jest, so it runs before any imports happen
jest.mock("ioredis", () => {
  return RedisMock;
});
