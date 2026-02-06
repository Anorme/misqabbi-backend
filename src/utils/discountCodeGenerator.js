import { codeExists } from "../models/discount.model.js";

/**
 * Characters used for generating discount codes.
 * Excludes confusing characters like 0/O, 1/I/L to avoid user input errors.
 */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Default code format: MISQ-XXXX-XXXX
 */
const DEFAULT_PREFIX = "MISQ";
const DEFAULT_SEGMENT_LENGTH = 4;
const DEFAULT_SEGMENT_COUNT = 2;

/**
 * Generate a random string of specified length using CODE_CHARS.
 *
 * @param {Number} length - Length of the string to generate
 * @returns {String} - Random string
 */
function generateRandomString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
}

/**
 * Generate a discount code with the format: PREFIX-XXXX-XXXX
 *
 * @param {Object} options - Code generation options
 * @param {String} options.prefix - Prefix for the code (default: "MISQ")
 * @param {Number} options.segmentLength - Length of each segment (default: 4)
 * @param {Number} options.segmentCount - Number of segments (default: 2)
 * @returns {String} - Generated discount code
 */
export function generateDiscountCode(options = {}) {
  const {
    prefix = DEFAULT_PREFIX,
    segmentLength = DEFAULT_SEGMENT_LENGTH,
    segmentCount = DEFAULT_SEGMENT_COUNT,
  } = options;

  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    segments.push(generateRandomString(segmentLength));
  }

  return `${prefix}-${segments.join("-")}`;
}

/**
 * Generate a unique discount code that doesn't exist in the database.
 * Retries up to maxAttempts times if a collision is found.
 *
 * @param {Object} options - Code generation options
 * @param {Number} maxAttempts - Maximum attempts before throwing (default: 10)
 * @returns {Promise<String>} - Unique discount code
 * @throws {Error} - If unable to generate unique code after max attempts
 */
export async function generateUniqueDiscountCode(
  options = {},
  maxAttempts = 10
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateDiscountCode(options);

    const exists = await codeExists(code);
    if (!exists) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique discount code after ${maxAttempts} attempts`
  );
}

/**
 * Validate a manually entered discount code format.
 * Codes should only contain alphanumeric characters and hyphens.
 *
 * @param {String} code - Code to validate
 * @returns {Object} - Validation result with isValid and message
 */
export function validateCodeFormat(code) {
  if (!code || typeof code !== "string") {
    return {
      isValid: false,
      message: "Discount code is required",
    };
  }

  const trimmedCode = code.trim();

  if (trimmedCode.length < 3) {
    return {
      isValid: false,
      message: "Discount code must be at least 3 characters long",
    };
  }

  if (trimmedCode.length > 50) {
    return {
      isValid: false,
      message: "Discount code must not exceed 50 characters",
    };
  }

  // Allow alphanumeric characters, hyphens, and underscores
  const validCodeRegex = /^[A-Za-z0-9_-]+$/;
  if (!validCodeRegex.test(trimmedCode)) {
    return {
      isValid: false,
      message:
        "Discount code can only contain letters, numbers, hyphens, and underscores",
    };
  }

  return {
    isValid: true,
    message: "Valid code format",
  };
}

/**
 * Normalize a discount code (uppercase and trim).
 *
 * @param {String} code - Code to normalize
 * @returns {String} - Normalized code
 */
export function normalizeCode(code) {
  if (!code || typeof code !== "string") {
    return "";
  }
  return code.toUpperCase().trim();
}
