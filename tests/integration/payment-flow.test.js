import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import {
  setupTestDB,
  teardownTestDB,
  setupTestRedis,
  cleanTestDB,
} from "../helpers/setup.js";
import { createUser, createProduct } from "../helpers/factories.js";

describe("Payment Flow", () => {
  beforeAll(async () => {
    await setupTestDB();
    setupTestRedis();
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
});
