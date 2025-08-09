import express from "express";

import {
  handleAddToCart,
  handleGetCart,
  handleRemoveFromCart,
  handleUpdateCartItem,
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/index.js";

const router = express.Router();

/**
 * @route   GET /cart
 * @desc    Retrieve the current user's cart
 * @access  Private
 */
router.get("/", authenticateToken, handleGetCart);

/**
 * @route   POST /cart
 * @desc    Add an item to the user's cart
 * @access  Private
 */
router.post("/", authenticateToken, handleAddToCart);

/**
 * @route   PUT /cart
 * @desc    Update an item in the user's cart
 * @access  Private
 */
router.put("/", authenticateToken, handleUpdateCartItem);

/**
 * @route   DELETE /cart/:productId
 * @desc    Remove an item from the user's cart by product ID
 * @access  Private
 */
router.delete("/:productId", authenticateToken, handleRemoveFromCart);

export default router;
