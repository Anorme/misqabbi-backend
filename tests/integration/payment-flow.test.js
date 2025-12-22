import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { setupTestDB, teardownTestDB, cleanTestDB } from "../helpers/setup.js";
import {
  createUser,
  createProduct,
  createCheckoutPayload,
} from "../helpers/factories.js";
import { createAuthenticatedUser } from "../helpers/authHelpers.js";
import {
  setupPaystackMocks,
  mockPaystackInitialize,
  mockPaystackVerify,
} from "../helpers/mocks.js";

const API_PREFIX = "/api/v1";

describe("Payment Flow", () => {
  beforeAll(async () => {
    await setupTestDB();
    setupPaystackMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await cleanTestDB();
  });

  it("should create a test user", async () => {
    const user = await createUser();

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.email).toContain("@example.com");
    expect(user.role).toBe("user");
  });

  it("should create test products", async () => {
    const product = await createProduct({ price: 100, stock: 10 });

    expect(product).toBeDefined();
    expect(product._id).toBeDefined();
    expect(product.price).toBe(100);
    expect(product.stock).toBe(10);
    expect(product.isPublished).toBe(true);
  });

  it("should create an authenticated user", async () => {
    const { request, user } = await createAuthenticatedUser();

    expect(request).toBeDefined();
    expect(user).toBeDefined();
    expect(user.email).toContain("@example.com");
  });

  it("should initialize checkout", async () => {
    const { request } = await createAuthenticatedUser();
    const product = await createProduct({ price: 100, stock: 10 });
    const payload = createCheckoutPayload([product]);

    mockPaystackInitialize();

    const res = await request
      .post(`${API_PREFIX}/orders/checkout`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("authorizationUrl");
    expect(res.body.data).toHaveProperty("reference");
  });

  it("should verify payment and create order", async () => {
    const { request } = await createAuthenticatedUser();
    const product = await createProduct({ price: 100, stock: 10 });
    const payload = createCheckoutPayload([product]);

    // Step 1: Initialize checkout
    mockPaystackInitialize();
    const checkoutRes = await request
      .post(`${API_PREFIX}/orders/checkout`)
      .send(payload);

    const reference = checkoutRes.body.data.reference;
    const amountInPesewas = 100 * 100; // 100 GHS = 10000 pesewas

    // Step 2: Mock Paystack verify (success)
    mockPaystackVerify({
      reference,
      status: "success",
      amount: amountInPesewas,
    });

    // Step 3: Verify payment
    const verifyRes = await request.get(
      `${API_PREFIX}/payment/verify/${reference}`
    );

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data).toHaveProperty("order");
    expect(verifyRes.body.data.order).toBeDefined();
  });
});
