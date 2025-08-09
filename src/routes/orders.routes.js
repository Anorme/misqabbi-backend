import express from "express";
import { authenticateToken } from "../middleware/index.js";
import {
  createOrder,
  getOrders,
  getOrderById,
} from "../controllers/orders.controller.js";
import { validateOrder } from "../middleware/validator.middleware.js";

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Protected
router.post("/checkout", validateOrder, authenticateToken, createOrder);

// @route   GET /api/orders
// @desc    Get all orders for authenticated user
// @access  Protected
router.get("/", authenticateToken, getOrders);

// @route   GET /api/orders/:id
// @desc    Get a specific order by ID
// @access  Protected
router.get("/:id", authenticateToken, getOrderById);

export default router;
