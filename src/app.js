import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import "./config/passport.js";

import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/index.js";

const app = express();

// TODO: Move API_PREFIX to environment config for flexibility across environments
const API_PREFIX = "/api/v1";

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Misqabbi backend is live" });
});

// Mount versioned routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(errorHandler);

export default app;
