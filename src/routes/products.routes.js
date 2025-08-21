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
 * @swagger
 * /products:
 *   get:
 *     summary: Fetch all published products
 *     description: Fetch all published products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Fetch a published product by ID
 *     description: Fetch a published product by ID
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: A product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.get("/:id", getProductByIdHandler);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post(
  "/",
  validateProduct,
  authenticateToken,
  checkAdmin,
  createProductHandler
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product details
 *     description: Update product details
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put("/:id", authenticateToken, checkAdmin, updateProductHandler);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     description: Delete a product by ID
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       204:
 *         description: No content
 */
router.delete("/:id", authenticateToken, checkAdmin, deleteProductHandler);

export default router;
