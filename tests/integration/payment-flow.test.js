import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { setupTestDB, teardownTestDB, cleanTestDB } from "../helpers/setup.js";
import { createUser, createProduct } from "../helpers/factories.js";
import { createAuthenticatedUser } from "../helpers/authHelpers.js";

describe("Payment Flow", () => {
  beforeAll(async () => {
    await setupTestDB();
    // Redis is already mocked at the top level, no need to call setupTestRedis()
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
});
