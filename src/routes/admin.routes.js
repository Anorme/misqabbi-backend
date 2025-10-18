import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";
import {
  getAllOrders,
  getUserAnalyticsHandler,
  updateOrderStatusHandler,
} from "../controllers/admin.controller.js";

const router = express.Router();

// TODO: Replace placeholder with real admin dashboard logic
router.get("/dashboard", authenticateToken, checkAdmin, (req, res) => {
  res.status(200).json({ message: "Admin dashboard placeholder" });
});

router.get("/orders", authenticateToken, checkAdmin, getAllOrders);

router.put(
  "/orders/:id",
  authenticateToken,
  checkAdmin,
  updateOrderStatusHandler
);

router.get(
  "/users/:id/analytics",
  authenticateToken,
  checkAdmin,
  getUserAnalyticsHandler
);

export default router;
