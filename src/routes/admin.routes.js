import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";

import { getUserAnalyticsHandler } from "../controllers/admin.controller.js";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from "../controllers/orders.controller.js";

const router = express.Router();

// TODO: Replace placeholder with real admin dashboard logic
router.get("/dashboard", authenticateToken, checkAdmin, (req, res) => {
  res.status(200).json({ message: "Admin dashboard placeholder" });
});

router.get("/orders", authenticateToken, checkAdmin, getAllOrdersAdmin);

router.patch(
  "/orders/:id",
  authenticateToken,
  checkAdmin,
  updateOrderStatusAdmin
);

router.get(
  "/analytics/:userId",
  authenticateToken,
  checkAdmin,
  getUserAnalyticsHandler
);

export default router;
