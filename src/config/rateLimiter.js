import { rateLimit } from "express-rate-limit";
import { slowDown } from "express-slow-down";

// Common configuration shared across all limiters
const COMMON_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
};

/**
 * Factory function to create rate limiters with custom limits
 * @param {number} limit - Maximum number of requests per window
 * @param {Object} overrides - Additional options to override defaults
 * @returns {Function} Express rate limiter middleware
 */
export const createRateLimiter = (limit, overrides = {}) => {
  return rateLimit({
    ...COMMON_CONFIG,
    limit,
    ...overrides,
  });
};

/**
 * Factory function to create slow-down middleware
 * @param {number} delayAfter - Number of requests before slowing down
 * @param {Function|number} delayMs - Delay function or fixed delay in ms
 * @param {Object} overrides - Additional options to override defaults
 * @returns {Function} Express slow-down middleware
 */
export const createSlowDown = (delayAfter, delayMs, overrides = {}) => {
  return slowDown({
    windowMs: COMMON_CONFIG.windowMs,
    delayAfter,
    delayMs,
    ...overrides,
  });
};

// Preset limiters for common patterns
export const rateLimiters = {
  // General API limiter (moderate)
  general: createRateLimiter(100),

  // Strict limiters (for sensitive operations)
  strict: createRateLimiter(10),

  // Very strict limiters (for critical operations)
  veryStrict: createRateLimiter(5),

  // Lenient limiters (for admin/internal operations)
  lenient: createRateLimiter(200),

  // Slow-down for resource-intensive endpoints
  productSlowDown: createSlowDown(
    50,
    hits => hits * hits * 1000 // Exponential delay
  ),
};

// Route-specific limiters (can be customized further if needed)
export const routeLimiters = {
  auth: rateLimiters.strict, // 10 requests
  newsletter: rateLimiters.veryStrict, // 5 requests
  order: rateLimiters.strict, // 10 requests
  payment: rateLimiters.strict, // 10 requests
  contact: rateLimiters.strict, // 10 requests
  admin: rateLimiters.lenient, // 200 requests
  products: rateLimiters.productSlowDown,
};
