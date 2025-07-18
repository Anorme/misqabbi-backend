const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

require("./config/passport");

const adminRoutes = require("./routes/orders.routes");
const orderRoutes = require("./routes/admin.routes");
const { errorHandler } = require("./middleware");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Misqabbi backend is live" });
});

// Mount routes (to be implemented)
app.use("/api/orders", adminRoutes);
app.use("/api/admin", orderRoutes);

app.use(errorHandler);

module.exports = app;
