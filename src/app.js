import env from "./config/env.js";

import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { serve, setup } from "swagger-ui-express";

import "./config/passport.js";
import corsOptions from "./config/cors.js";
import swaggerSpec from "./config/swagger.js";
import { rateLimiters, routeLimiters } from "./config/rateLimiter.js";

import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import productRoutes from "./routes/products.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import contactRoutes from "./routes/contact.routes.js";

import { errorHandler } from "./middleware/index.js";

const app = express();

// This ensures correct IP detection for rate limiting
app.set("trust proxy", 1);

const API_PREFIX = env.API_PREFIX || "/api/v1";

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// IMPORTANT: Webhook route needs raw body BEFORE JSON parsing
// Apply raw body parser specifically for Paystack webhook route
// This must come before express.json() to preserve the original body bytes
app.use(
  `${API_PREFIX}/payment/webhook/paystack`,
  express.raw({ type: "application/json" })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions(env.NODE_ENV)));
app.use(`${API_PREFIX}/api-docs`, serve, setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Misqabbi backend is live" });
});

// Mount versioned routes
// Rate limiters are applied per-route or per-route-group as needed
app.use(`${API_PREFIX}/admin`, routeLimiters.admin, adminRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/favorites`, rateLimiters.general, favoritesRoutes);
app.use(`${API_PREFIX}/orders`, routeLimiters.order, orderRoutes);

app.use(`${API_PREFIX}/payment`, paymentRoutes);
app.use(`${API_PREFIX}/products`, routeLimiters.products, productRoutes);
app.use(`${API_PREFIX}/newsletter`, routeLimiters.newsletter, newsletterRoutes);
app.use(`${API_PREFIX}/contact`, routeLimiters.contact, contactRoutes);

app.use(errorHandler);

export default app;
