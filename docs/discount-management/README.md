# Discount Management

Overview of the discount management feature: admin-created discount codes, user validation, and checkout integration.

## Summary

- **Admins** create and manage discount codes (CRUD, stats, usage history) via `/api/v1/admin/discounts`.
- **Users** validate a code against their cart via `POST /api/v1/discounts/validate`.
- **Checkout** accepts an optional `discountCode`; the backend validates it, computes the discount, and applies it to the payment amount. After successful payment, usage is recorded.

Only one discount code can be applied per order (no stacking).

## High-Level Flow

1. Admin creates a discount (manual code or auto-generated) with type, value, scope, usage limits, and expiry.
2. User applies a code at cart or checkout; frontend calls `POST /discounts/validate` with code and cart data to get the discounted total.
3. User proceeds to checkout; request body includes `discountCode`. Backend re-validates, computes final total (subtotal + express fee - discount), creates a transaction, and returns Paystack authorization URL.
4. After successful payment (Paystack webhook or verify), the order is created with discount fields; discount usage is recorded and global/per-user counters updated.

## File Map

| Layer | File | Purpose |
|-------|------|---------|
| Routes | `src/routes/discount.routes.js` | User: validate discount |
| Routes | `src/routes/admin.routes.js` | Admin: discount CRUD, stats, usage, generate code |
| Controllers | `src/controllers/discountUser.controller.js` | User validate handler |
| Controllers | `src/controllers/discount.controller.js` | Admin discount handlers |
| Controllers | `src/controllers/orders.controller.js` | Checkout: discount validation and final total |
| Controllers | `src/controllers/payment.controller.js` | Post-payment: record usage, increment counters |
| Service | `src/services/discountService.js` | Validation and calculation logic |
| Models | `src/models/discount.mongo.js` | Discount schema |
| Models | `src/models/discount.model.js` | Discount data access |
| Models | `src/models/discountUsage.mongo.js` | Usage record schema |
| Models | `src/models/discountUsage.model.js` | Usage data access |
| Utils | `src/utils/discountCodeGenerator.js` | Random code generation, format validation |
| Validators | `src/validators/order.validator.js` | Optional `discountCode` on checkout body |

## Related Documentation

- [API Reference](api.md) – Routes, methods, auth, request/response summary.
- [Business Rules](business-rules.md) – Validation, calculation, scope, error codes, security.

Full request/response schemas are available in Swagger at `{API_PREFIX}/api-docs`.
