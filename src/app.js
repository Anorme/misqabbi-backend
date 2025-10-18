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

import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import productRoutes from "./routes/products.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";

import { errorHandler } from "./middleware/index.js";

const app = express();

// TODO: Move API_PREFIX to environment config for flexibility across environments
const API_PREFIX = "/api/v1";

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions(env.NODE_ENV)));
app.use("/api-docs", serve, setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Misqabbi backend is live" });
});

// Mount versioned routes
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/favorites`, favoritesRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/newsletter`, newsletterRoutes);

app.use(errorHandler);

export default app;
