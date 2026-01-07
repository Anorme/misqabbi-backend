# Test Infrastructure Helpers

This directory contains helper files for setting up and managing test infrastructure.

## Files Overview

### 1. `setup.js` - Database & Service Setup/Teardown

**Purpose:** Manages the lifecycle of test databases (MongoDB Memory Server) and services (Redis Mock).

**Key Functions:**

- `setupTestDB()` - Starts MongoDB Memory Server and connects Mongoose
- `teardownTestDB()` - Stops MongoDB and disconnects Mongoose
- `setupTestRedis()` - Mocks the Redis service to use ioredis-mock
- `teardownTestRedis()` - Cleans up Redis mock
- `cleanTestDB()` - Clears all collections and Redis keys

**Usage:**

```javascript
import {
  setupTestDB,
  teardownTestDB,
  setupTestRedis,
} from "./helpers/setup.js";

beforeAll(async () => {
  await setupTestDB();
  setupTestRedis();
});

afterAll(async () => {
  await teardownTestDB();
});
```

---

### 2. `factories.js` - Test Data Factories

**Purpose:** Provides factory functions to create test data with sensible defaults.

**Key Functions:**

- `createUser(overrides)` - Creates a test user
- `createAdminUser(overrides)` - Creates an admin user
- `createProduct(overrides)` - Creates a test product
- `createProductVariant(baseProduct, overrides)` - Creates a product variant
- `createOrderItems(products, overrides)` - Creates order items
- `createShippingInfo(overrides)` - Creates shipping information
- `createCheckoutPayload(products, options)` - Creates complete checkout payload
- `createTransactionData(user, orderData, overrides)` - Creates transaction data

**Usage:**

```javascript
import {
  createUser,
  createProduct,
  createCheckoutPayload,
} from "./helpers/factories.js";

// Create with defaults
const user = await createUser();

// Override specific fields
const admin = await createAdminUser({ email: "admin@test.com" });

// Create products and checkout payload
const product1 = await createProduct({ price: 150 });
const product2 = await createProduct({ price: 200 });
const payload = createCheckoutPayload([product1, product2]);
```

---

### 3. `authHelpers.js` - Authentication Helpers

**Purpose:** Provides helper functions to create authenticated users and make authenticated requests using supertest.

**Key Functions:**

- `createAuthenticatedUser(userData, options)` - Creates user and returns authenticated supertest agent
- `createAuthenticatedAdmin(userData)` - Creates admin user and returns authenticated agent
- `getAuthCookies(userData)` - Gets auth cookies for manual cookie setting
- `createRequestWithCookies(cookies)` - Creates agent with pre-set cookies

**Why Supertest's Cookie Jar:**

- Supertest automatically maintains cookies across requests
- Tests real auth flow (signup/login endpoints)
- Each test gets isolated agent
- No manual cookie management needed

**How It Works:**

1. Calls `/auth/signup` or `/auth/login`
2. Supertest stores cookies in the agent
3. Subsequent requests with that agent are automatically authenticated

**Usage:**

```javascript
import { createAuthenticatedUser } from "./helpers/authHelpers.js";

it("should access protected route", async () => {
  const { request } = await createAuthenticatedUser();
  const API_PREFIX = "/api/v1";

  // This request is automatically authenticated!
  const res = await request.get(`${API_PREFIX}/auth/me`);
  expect(res.status).toBe(200);
});
```

---

### 4. `mocks.js` - External Service Mocks

**Purpose:** Provides mocks for external services (Paystack API) used in tests.

**Key Functions:**

- `setupPaystackMocks(options)` - Sets up Paystack API mocks
- `mockPaystackInitialize(options)` - Mocks transaction initialization
- `mockPaystackVerify(options)` - Mocks transaction verification
- `generatePaystackSignature(body, secretKey)` - Generates webhook signature
- `createPaystackWebhookPayload(options)` - Creates webhook payload with signature
- `resetPaystackMocks()` - Resets all mocks

**Why Mock Paystack:**

- No network dependency: Tests run faster
- Predictable: Control responses for different scenarios
- No API costs: Don't use up test API quota
- Test error cases: Easy to simulate failures
- Deterministic: Same responses every time

**Note:** You can use real Paystack API by setting `USE_REAL_PAYSTACK=true` environment variable.

**Usage:**

```javascript
import {
  setupPaystackMocks,
  mockPaystackInitialize,
  createPaystackWebhookPayload,
} from "./helpers/mocks.js";

beforeAll(() => {
  setupPaystackMocks();
});

it("should initialize payment", async () => {
  mockPaystackInitialize({
    reference: "TEST_REF_123",
    authorizationUrl: "https://checkout.paystack.com/test",
  });

  // Test payment initialization...
});

it("should handle webhook", async () => {
  const { payload, headers } = createPaystackWebhookPayload({
    event: "charge.success",
    reference: "TEST_REF_123",
    amount: 10000,
  });

  const res = await request
    .post("/api/v1/payment/webhook/paystack")
    .set(headers)
    .send(payload);
});
```

---

## Complete Test Example

```javascript
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
import { createAuthenticatedUser } from "../helpers/authHelpers.js";
import { createProduct, createCheckoutPayload } from "../helpers/factories.js";
import {
  setupPaystackMocks,
  mockPaystackInitialize,
} from "../helpers/mocks.js";

describe("Checkout Flow", () => {
  beforeAll(async () => {
    await setupTestDB();
    setupTestRedis();
    setupPaystackMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await cleanTestDB();
  });

  it("should initialize checkout", async () => {
    // Create authenticated user
    const { request } = await createAuthenticatedUser();

    // Create products
    const product1 = await createProduct({ price: 100, stock: 10 });
    const product2 = await createProduct({ price: 200, stock: 5 });

    // Create checkout payload
    const payload = createCheckoutPayload([product1, product2]);

    // Mock Paystack response
    mockPaystackInitialize({
      reference: "TEST_REF_123",
    });

    // Make request
    const res = await request.post("/api/v1/orders/checkout").send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("authorizationUrl");
  });
});
```

---

## File Dependencies

```
setup.js
  ├── mongodb-memory-server (MongoDB in-memory)
  ├── mongoose (ODM)
  └── ioredis-mock (Redis mock)

factories.js
  ├── src/models/user.model.js (createLocalUser)
  └── src/models/product.model.js (createProduct)

authHelpers.js
  └── src/app.js (Express app for supertest)

mocks.js
  └── axios (mocked for Paystack API)
```

---

## Best Practices

1. **Always clean DB between tests** - Use `cleanTestDB()` in `beforeEach` for isolation
2. **Use factories for test data** - Don't manually create test objects
3. **One agent per test** - Each test should get its own authenticated agent
4. **Mock external services** - Mock Paystack, email services, etc.
5. **Test real behavior** - Use real MongoDB, not mocks, for database operations
