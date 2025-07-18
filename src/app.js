const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

require("./config/passport");

const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");
const { errorHandler } = require("./middleware");

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

module.exports = app;
