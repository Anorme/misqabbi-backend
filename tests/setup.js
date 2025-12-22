import { jest } from "@jest/globals";
import RedisMock from "ioredis-mock";

// Mock ioredis at the library level - this runs BEFORE all test files
// When redis.js does: import Redis from "ioredis", it gets ioredis-mock instead
// This is hoisted by Jest, so it runs before any imports happen
jest.mock("ioredis", () => {
  return RedisMock;
});

// Mock axios at the library level - this runs BEFORE all test files
// Create a shared mock instance that can be accessed by test helpers
const axiosMock = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  head: jest.fn(),
  options: jest.fn(),
  request: jest.fn(),
  create: jest.fn(function () {
    return this;
  }),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

// Store mock in global so test helpers can access it
global.axiosMock = axiosMock;

// For ES modules, jest.mock() works but must be hoisted before imports
// The mock structure must match axios's actual exports
jest.mock("axios", () => {
  return {
    __esModule: true,
    default: axiosMock,
    ...axiosMock,
  };
});
