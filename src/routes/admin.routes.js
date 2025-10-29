import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";
import { validateProduct } from "../middleware/validator.middleware.js";
import { attachImagesToBody } from "../middleware/upload.middleware.js";
import { productUploads } from "../config/cloudinary.js";

import { getUserAnalyticsHandler } from "../controllers/admin.controller.js";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from "../controllers/orders.controller.js";
import {
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getProductsAdmin,
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

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products including unpublished (admin only)
 *     description: Retrieve a paginated list of all products with support for filtering, searching, and sorting. Includes both published and unpublished products.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search query for product name, description, or category
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter products by category
 *       - in: query
 *         name: minPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: isPublished
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filter by publish status. Use "true" for published only, "false" for unpublished only, "all" for all products (default)
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum: [latest, price-low-high, price-high-low, name-a-z, name-z-a]
 *           default: latest
 *         description: Sort products by specified criteria
 *     responses:
 *       200:
 *         description: A list of products (published and unpublished)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Product"
 *                 total:
 *                   type: integer
 *                   description: Total number of products matching filters
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages available
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Failed to load products
 */
router.get("/products", authenticateToken, checkAdmin, getProductsAdmin);

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
 *     description: Create a new product with support for uploading up to 5 images. The images must be sent as multipart/form-data along with the product data fields.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product data to create, with image uploads. Use 'multipart/form-data' and send field `images` as up to 5 files.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The product name.
 *               description:
 *                 type: string
 *                 description: The product description.
 *               price:
 *                 type: number
 *                 description: The product price.
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 product images.
 *                 maxItems: 5
 *               category:
 *                 type: string
 *                 description: The product category.
 *               stock:
 *                 type: integer
 *                 description: Product stock quantity.
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
  authenticateToken,
  checkAdmin,
  productUploads.array("images", 5),
  attachImagesToBody,
  validateProduct,
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
