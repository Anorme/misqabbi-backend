# Misqabbi Store

## 🛍️ Description

This is the backend for the **Misqabbi Store**, an e-commerce platform that powers a women-owned fashion brand specializing in made-to-measure pieces designed exclusively for women.

Built with Node.js, Express and MongoDB, this backend is designed for scalability, security, and collaboration.

---

## ⚙️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/anorme/misqabbi-backend.git
   ```

2. Navigate into the project directory:

   ```bash
   cd misqabbi-backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI="MongoDB Atlas connection string"
   JWT_SECRET="JWT secret"
   ```

---

## 🚀 Usage

To start the development server in watch mode:

```bash
npm run dev
```

To start the server normally:

```bash
npm start
```

---

## 🔐 Authentication & RBAC

Authentication is handled using Passport.js and JWT. Role-based access control is enforced via middleware.

> For migration progress and implementation details, see [Migration Issue #3](https://github.com/anorme/misqabbi-store/issues/3)

---

## 📦 Routes Overview

### 👤 User Endpoints

| Endpoint        | Method | Access    | Description                         |
| --------------- | ------ | --------- | ----------------------------------- |
| `/api/users/me` | GET    | Auth only | Get current user's profile(TODO)    |
| `/api/users/me` | PUT    | Auth only | Update current user's profile(TODO) |

> These endpoints use JWT-based authentication to identify the user via `req.user`.

---

### 🛍️ Product Endpoints

| Endpoint                                  | Method | Access | Description                                  |
| ----------------------------------------- | ------ | ------ | -------------------------------------------- |
| `/api/products`                           | GET    | Public | Get all products(TODO)                       |
| `/api/products/:id`                       | GET    | Public | Get product by ID(TODO)                      |
| `/api/products?category=...`              | GET    | Public | Filter products by category(TODO)            |
| `/api/products?search=...`                | GET    | Public | Search products by name or description(TODO) |
| `/api/products?priceMin=...&priceMax=...` | GET    | Public | Filter products by price range(TODO)         |

> These endpoints support flexible query parameters for filtering and search.

---

### 📦 Order Endpoints

| Endpoint          | Method | Access    | Description             |
| ----------------- | ------ | --------- | ----------------------- |
| `/api/orders`     | GET    | Auth only | Get all orders (TODO)   |
| `/api/orders/:id` | GET    | Auth only | Get order by ID (TODO)  |
| `/api/orders`     | POST   | Auth only | Create new order (TODO) |

---

### 🛡️ Admin Endpoints

| Endpoint                  | Method | Access     | Description                     |
| ------------------------- | ------ | ---------- | ------------------------------- |
| `/api/admin/dashboard`    | GET    | Admin only | Protected admin dashboard route |
| `/api/admin/products`     | POST   | Admin only | Create new product (TODO)       |
| `/api/admin/products/:id` | PUT    | Admin only | Update product (TODO)           |
| `/api/admin/products/:id` | DELETE | Admin only | Delete product (TODO)           |

---

## 🧠 Notes

- All protected routes require a valid JWT in the `Authorization` header.
- Admin routes require the user to have `role: 'admin'`.
- Query parameters for `/products` can be combined for advanced filtering.

---

## 🤝 Contributing

We love contributions! To get started, please read our  
[Contributing Guide](CONTRIBUTING.md) for coding standards, commit conventions, and submission steps.

If you're collaborating on the RBAC or authentication features, check the section above for implementation notes and TODOs.

---

## 📄 License

This project does not currently have a license. Check back later for updates.

---
