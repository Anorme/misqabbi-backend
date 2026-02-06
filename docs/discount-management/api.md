# Discount Management API Reference

Base URL for all routes: `{API_PREFIX}` (default `/api/v1`). Authentication uses the `auth_token` cookie.

## User Routes

Mounted at `{API_PREFIX}/discounts`. Requires authenticated user (any role).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/validate` | User | Validate a discount code against the current user and cart. Returns discount amount and final total, or error code and message. |

### POST /discounts/validate

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Discount code (e.g. `SAVE20`). |
| cartTotal | number | Yes | Cart subtotal in GHS. |
| itemCount | number | Yes | Number of items in cart. |
| items | array | No | Required for product-scoped discounts. Each item: `product` (id), `price`, `quantity`, `category`. |

**Success (200)**  
`success`, `message`, `data`: `code`, `description`, `discountType`, `discountValue`, `discountAmount`, `originalTotal`, `finalTotal`, `savings`.

**Error (400)**  
`success: false`, `errorCode`, `error`. See [Business Rules](business-rules.md#error-codes) for error codes and messages.

---

## Admin Routes

Mounted at `{API_PREFIX}/admin/discounts`. Requires authenticated admin (`checkAdmin`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Aggregate stats (total discounts, active, expired, etc.). |
| POST | `/generate-code` | Generate a unique random code (optional body: prefix, segmentLength, segmentCount). Does not create a discount. |
| GET | `/` | Paginated list with optional filters: page, limit, isActive, scope, usageType, expired, q. |
| POST | `/` | Create a discount. Required: discountType, discountValue, expiryDate. Optional: code (auto-generated if omitted), description, maxDiscountAmount, scope, applicableProducts, applicableCategories, usageType, maxGlobalUses, maxUsesPerUser, minOrderValue, minItemCount, firstOrderOnly, isActive. |
| GET | `/:id` | Single discount with usage stats. |
| PUT | `/:id` | Update discount (any subset of updatable fields). Code cannot be changed. |
| DELETE | `/:id` | Soft-deactivate (sets isActive to false). |
| GET | `/:id/usage` | Paginated usage history for the discount (page, limit). |

### Create discount (POST /admin/discounts)

**Required**

- `discountType`: `"percentage"` or `"fixed"`
- `discountValue`: number (0–100 for percentage; any non-negative for fixed)
- `expiryDate`: ISO date string, must be in the future

**Optional**

- `code`: string (custom code; must pass format validation). Omit to auto-generate.
- `description`: string
- `maxDiscountAmount`: number (cap for percentage discounts)
- `scope`: `"order"` (default) or `"products"`
- `applicableProducts`: array of product ObjectIds (required when scope is products, unless applicableCategories is set)
- `applicableCategories`: array of category strings (required when scope is products, unless applicableProducts is set)
- `usageType`: `"single_use"` | `"multi_use"` | `"per_user"` (default `"multi_use"`)
- `maxGlobalUses`: number (total uses across all users; for multi_use/single_use)
- `maxUsesPerUser`: number (default 1; for per_user)
- `minOrderValue`: number (minimum cart total in GHS)
- `minItemCount`: number (minimum number of items)
- `firstOrderOnly`: boolean (default false)
- `expiryDate`: ISO date string
- `isActive`: boolean (default true)

Product-scoped discounts require at least one of `applicableProducts` or `applicableCategories`. Product IDs and categories are validated against the database.

### Update discount (PUT /admin/discounts/:id)

Same optional fields as create (except code). Partial updates supported. Switching scope to `order` clears applicableProducts and applicableCategories.

---

## Checkout Integration

**POST** `{API_PREFIX}/orders/checkout`

Checkout body may include an optional `discountCode` (string). The backend:

1. Validates the code for the current user and cart (same rules as `/discounts/validate`).
2. Computes final total = subtotal + express fee - discount amount.
3. Stores discount info on the transaction; after successful payment, usage is recorded and order is created with discount fields.

See [Business Rules](business-rules.md#checkout-and-payment-integration) for flow details.

---

For full request/response schemas and examples, use Swagger at `{API_PREFIX}/api-docs`.
