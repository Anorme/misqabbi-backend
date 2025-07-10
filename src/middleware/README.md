# Middleware Summary

## `verifyToken`

**Purpose:** Authenticate requests using Firebase ID tokens.

**How it works:**

- Expects header: `Authorization: Bearer <idToken>`
- Verifies the token via Firebase Admin SDK
- Attaches decoded user info to `req.user`
- Rejects requests with missing or invalid tokens

**Use:** Place before protected routes:

```js
app.get("/secure", verifyToken, handler);
```

---

## `checkAdmin`

**Purpose:** Restrict access to admin-only routes.

**How it works:**

- Reads UID from `req.user` (set by `verifyToken`)
- Fetches user’s Firestore record
- Checks if `role === 'admin'`
- Blocks access if not admin

**Use:** Chain after `verifyToken`:

```js
app.get("/admin", verifyToken, checkAdmin, handler);
```

---
