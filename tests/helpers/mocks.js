import { jest } from "@jest/globals";
import crypto from "crypto";

export const USE_REAL_PAYSTACK = process.env.USE_REAL_PAYSTACK === "true";

// Use global axiosMock set up in tests/setup.js, or create local one if not available
let axiosMock = global.axiosMock || null;

/**
 * @param {Object} options - Mock options
 * @param {boolean} options.useRealAPI - Use real Paystack API instead of mocks
 */
export function setupPaystackMocks(options = {}) {
  if (USE_REAL_PAYSTACK || options.useRealAPI) {
    return;
  }

  axiosMock = {
    post: jest.fn(),
    get: jest.fn(),
  };

  jest.mock("axios", () => {
    const actualAxios = jest.requireActual("axios");
    return {
      ...actualAxios,
      default: {
        ...actualAxios.default,
        post: axiosMock.post,
        get: axiosMock.get,
      },
      post: axiosMock.post,
      get: axiosMock.get,
    };
  });

  return axiosMock;
}

/**
 * @param {Object} options - Response options
 * @param {string} options.reference - Transaction reference
 * @param {string} options.authorizationUrl - Payment URL
 * @param {boolean} options.shouldFail - Whether to simulate failure
 * @returns {Object} Mock response data
 */
export function mockPaystackInitialize(options = {}) {
  const reference = options.reference || `MISQ_${Date.now()}_TEST`;
  const authorizationUrl =
    options.authorizationUrl || `https://checkout.paystack.com/${reference}`;

  const mockResponse = {
    status: !options.shouldFail,
    message: options.shouldFail
      ? "Transaction initialization failed"
      : "Authorization URL created",
    data: {
      authorization_url: authorizationUrl,
      access_code: `access_${reference}`,
      reference,
    },
  };

  if (axiosMock) {
    axiosMock.post.mockResolvedValueOnce({
      data: mockResponse,
      status: 200,
    });
  }

  return mockResponse;
}

/**
 * @param {Object} options - Response options
 * @param {string} options.reference - Transaction reference
 * @param {string} options.status - Transaction status ('success', 'failed', 'pending')
 * @param {number} options.amount - Amount in pesewas
 * @param {boolean} options.shouldFail - Whether API call should fail
 * @returns {Object} Mock response data
 */
export function mockPaystackVerify(options = {}) {
  const reference = options.reference || `MISQ_${Date.now()}_TEST`;
  const status = options.status || "success";
  const amount = options.amount || 10000;

  const mockResponse = {
    status: !options.shouldFail,
    message: options.shouldFail
      ? "Transaction verification failed"
      : "Verification successful",
    data: {
      reference,
      status,
      amount,
      currency: "GHS",
      customer: {
        email: "test@example.com",
      },
      authorization: {
        authorization_code: `AUTH_${reference}`,
        card_type: "visa",
        last4: "1234",
      },
      paid_at: status === "success" ? new Date().toISOString() : null,
    },
  };

  if (axiosMock) {
    axiosMock.get.mockResolvedValueOnce({
      data: mockResponse,
      status: 200,
    });
  }

  return mockResponse;
}

/**
 * @param {string} body - Raw request body (JSON string)
 * @param {string} secretKey - Paystack secret key
 * @returns {string} HMAC signature
 */
export function generatePaystackSignature(body, secretKey) {
  return crypto
    .createHmac("sha512", secretKey)
    .update(body, "utf8")
    .digest("hex");
}

/**
 * @param {Object} options - Webhook options
 * @param {string} options.event - Event type ('charge.success', 'charge.failed')
 * @param {string} options.reference - Transaction reference
 * @param {number} options.amount - Amount in pesewas
 * @param {string} options.secretKey - Paystack secret key for signature
 * @returns {Object} Webhook payload with signature
 */
export function createPaystackWebhookPayload(options = {}) {
  const event = options.event || "charge.success";
  const reference = options.reference || `MISQ_${Date.now()}_TEST`;
  const amount = options.amount || 10000;
  const secretKey =
    options.secretKey || process.env.PAYSTACK_SECRET_KEY || "test_secret_key";

  const payload = {
    event,
    data: {
      reference,
      amount,
      currency: "GHS",
      status: event === "charge.success" ? "success" : "failed",
      customer: {
        email: "test@example.com",
      },
      authorization: {
        authorization_code: `AUTH_${reference}`,
      },
    },
  };

  const body = JSON.stringify(payload);
  const signature = generatePaystackSignature(body, secretKey);

  return {
    payload,
    body,
    signature,
    headers: {
      "x-paystack-signature": signature,
    },
  };
}

export function resetPaystackMocks() {
  if (axiosMock) {
    axiosMock.post.mockReset();
    axiosMock.get.mockReset();
  }
}

/**
 * @returns {Object|null} Axios mock instance or null if not set up
 */
export function getPaystackMock() {
  return axiosMock;
}
