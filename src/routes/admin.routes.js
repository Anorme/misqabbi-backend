import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";
import { validateProduct } from "../middleware/validator.middleware.js";
import { getUserAnalyticsHandler } from "../controllers/admin.controller.js";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from "../controllers/orders.controller.js";
import {
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
} from "../controllers/products.controller.js";

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

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a new product (admin only)
 *     description: Create a new product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product data to create
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Product"
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Invalid product data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Invalid product data"
 */
router.post(
  "/products",
  validateProduct,
  authenticateToken,
  checkAdmin,
  createProductAdmin
);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update an existing product (admin only)
 *     description: Update an existing product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Product data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Product update failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Product update failed"
 */
router.put("/products/:id", authenticateToken, checkAdmin, updateProductAdmin);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a product by ID (admin only)
 *     description: Delete a product by ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       400:
 *         description: Product deletion failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Product deletion failed"
 */
router.delete(
  "/products/:id",
  authenticateToken,
  checkAdmin,
  deleteProductAdmin
);

export default router;
