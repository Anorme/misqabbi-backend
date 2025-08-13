import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";
import {
  createProductHandler,
  deleteProductHandler,
  getProductByIdHandler,
  getProducts,
  updateProductHandler,
} from "../controllers/products.controller.js";
import { validateProduct } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @route   GET /products
 * @desc    Fetch all published products
 * @access  Public
 */
router.get("/", getProducts);

/**
 * @route   GET /products/:id
 * @desc    Fetch a published product by ID
 * @access  Public
 */
router.get("/:id", getProductByIdHandler);

/**
 * @route   POST /products
 * @desc    Create a new product
 * @access  Admin (Requires authentication and admin role)
 */
router.post(
  "/",
  validateProduct,
  authenticateToken,
  checkAdmin,
  createProductHandler
);

/**
 * @route   PUT /products/:id
 * @desc    Update product details
 * @access  Admin (Requires authentication and admin role)
 */
router.put("/:id", authenticateToken, checkAdmin, updateProductHandler);

/**
 * @route   DELETE /products/:id
 * @desc    Delete a product by ID
 * @access  Admin (Requires authentication and admin role)
 */
router.delete("/:id", authenticateToken, checkAdmin, deleteProductHandler);

export default router;
