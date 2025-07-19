# Middleware Summary

This folder contains authentication and authorization middleware for the Misqabbi backend, now powered by JWT and MongoDB.

---

## `authenticateToken`

**Purpose:** Authenticate requests using JWT tokens.

**How it works:**

- Expects header: `Authorization: Bearer <token>`
- Verifies the token using the server's JWT secret
- Decodes payload to extract user ID
- Fetches full user document from MongoDB
- Attaches user object to `req.user`
- Rejects requests with missing, malformed, or expired tokens

**Use:** Place before protected routes:

```js
app.get("/secure", authenticateToken, handler);
```

---

## `checkAdmin`

**Purpose:** Restrict access to admin-only routes.

**How it works:**

- Assumes `req.user` is populated by `authenticateToken`
- Checks if `req.user.role === 'admin'`
- Blocks access if role is not `'admin'`

**Use:** Chain after `authenticateToken`:

```js
app.get("/admin", authenticateToken, checkAdmin, handler);
```

---

## Notes

- Consider limiting selected fields from the user document for performance
- Replace `console.error` with structured logging in production
- Future enhancements may include role hierarchy or scoped permissions

```

---
```
