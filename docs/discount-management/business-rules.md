# Discount Management Business Rules

Validation order, calculation logic, scope behavior, error codes, and security.

## Validation Order

When a user applies a discount code, the service validates in this order. The first failure returns the corresponding error code and message.

1. **Code exists** – Discount document found by code (normalized, uppercase).
2. **Active** – `isActive` is true.
3. **Not expired** – `expiryDate` is in the future.
4. **Global usage** – For single_use/multi_use: `currentGlobalUses < maxGlobalUses` (or no limit). Method: `discount.hasReachedGlobalLimit()`.
5. **Per-user usage** – User has not exceeded allowed uses. For `per_user`: `countUserUsage(discountId, userId) < maxUsesPerUser`; otherwise one use per user.
6. **First order only** – If `firstOrderOnly`, user must have zero prior orders (`countOrdersByUser(userId) === 0`).
7. **Minimum order value** – If `minOrderValue` is set, `cartTotal >= minOrderValue`.
8. **Minimum item count** – If `minItemCount` is set, `itemCount >= minItemCount`.
9. **Product scope** – If scope is `products`, cart must contain at least one item matching `applicableProducts` or `applicableCategories`. Applicable amount is computed; if zero, validation fails with NO_APPLICABLE_ITEMS.
10. **Discount amount** – Discount is computed from applicable amount; result is returned with the validation success.

## Calculation

### Applicable Amount

- **Order scope:** Applicable amount = cart total.
- **Products scope:** Applicable amount = sum of (price × quantity) for cart items that match:
  - Product ID in `discount.applicableProducts`, or
  - Product category (lowercase) in `discount.applicableCategories`.
  Matching is by product ID or category; at least one of the two lists must be configured.

### Discount Amount

- **Percentage:** `discountAmount = applicableAmount × (discountValue / 100)`. If `maxDiscountAmount` is set, `discountAmount = min(discountAmount, maxDiscountAmount)`.
- **Fixed:** `discountAmount = min(discountValue, applicableAmount)`.

Result is rounded to two decimal places. The discount never exceeds the applicable amount.

## Scope Behavior

| Scope | Applicable amount | When to use |
|-------|-------------------|-------------|
| order | Entire cart total | Site-wide or cart-wide promotions. |
| products | Sum of matching line items | Category- or product-specific promotions. Requires `applicableProducts` and/or `applicableCategories`. |

Product-scoped discounts require at least one of `applicableProducts` or `applicableCategories` at create/update. Product IDs are validated against the Product collection; categories are validated against existing product categories (distinct from products).

## Usage Types

| usageType | Meaning |
|-----------|---------|
| single_use | Code valid until `maxGlobalUses` (typically 1) is reached. |
| multi_use | Code can be used up to `maxGlobalUses` times across all users. |
| per_user | Each user can use the code up to `maxUsesPerUser` times. |

Global usage is tracked on the discount document (`currentGlobalUses`). Per-user usage is tracked in the DiscountUsage collection.

## Error Codes

Used in validation responses (`errorCode` and user-facing `error`). Internal logging uses detailed messages; public responses use sanitized messages where noted.

| Code | Public message (or note) |
|------|--------------------------|
| INVALID_CODE | "This discount code is not valid" (sanitized) |
| CODE_EXPIRED | "This discount code is not valid" (sanitized) |
| CODE_INACTIVE | "This discount code is not valid" (sanitized) |
| USAGE_LIMIT_REACHED | "This discount code has reached its usage limit" |
| ALREADY_USED | "You have already used this discount code" |
| MIN_ORDER_NOT_MET | "Minimum order value of GHS {amount} required" |
| MIN_ITEMS_NOT_MET | "Minimum of {count} items required" |
| FIRST_ORDER_ONLY | "This discount code is only valid for your first order" |
| NO_APPLICABLE_ITEMS | "No items in your cart are eligible for this discount" |

Sanitized codes (INVALID_CODE, CODE_EXPIRED, CODE_INACTIVE) share the same generic message to prevent enumeration of valid codes. Other codes are specific so users can act on them.

## Security

- **Error message sanitization:** Existence-related failures (invalid, expired, inactive) return a single generic message. Detailed reasons are logged server-side only.
- **Server-side totals:** Checkout and payment use server-computed prices and discount amounts. Client-supplied totals are not trusted for payment.
- **Usage recording:** Usage is recorded only after successful payment (webhook or verify). Failed or abandoned checkouts do not consume the discount.

## Checkout and Payment Integration

1. **Checkout request** – Body may include optional `discountCode`. Order validator allows `discountCode` (optional string).
2. **During checkout** – Controller builds cart data from validated cart items and product documents (including category). Calls `validateDiscountForCheckout(code, userId, cartData)`. On success, final total = subtotal + express fee - discount amount. Discount info (code, amount, id) is stored on the transaction’s `orderData`.
3. **Payment** – User is sent to Paystack for the final amount. No discount logic runs in the payment initiation; the amount already includes the discount.
4. **After successful payment** – Payment controller creates the order with discount fields (`discountCode`, `discountAmount`, `discountId`). It then records one DiscountUsage row and increments the discount’s `currentGlobalUses`. This happens in the same flow that creates the order (e.g. webhook or verify handler).

## Data Model Summary

- **Discount:** code, type, value, max cap, scope, applicableProducts, applicableCategories, usageType, limits, min order/item, firstOrderOnly, expiry, isActive, createdBy. Methods: `hasReachedGlobalLimit()`, `isValid()`.
- **DiscountUsage:** discount, user, order (set after payment), usedAt, amountSaved. Used for per-user counts and reporting.
