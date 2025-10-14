import express from "express";
import { authenticateToken } from "../middleware/index.js";
import {
  createOrder,
  getOrders,
  getOrderById,
} from "../controllers/orders.controller.js";
import { validateOrder } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Creates a new order
 *     description: Creates a new order
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Order data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *     responses:
 *       201:
 *         description: Created order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post("/checkout", validateOrder, authenticateToken, createOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders for authenticated user
 *     description: Get all orders for authenticated user
 *     tags:
 *       - Orders
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
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: User orders (paginated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *             example:
 *               success: true
 *               data: []
 *               total: 0
 *               totalPages: 0
 *               currentPage: 1
 */
router.get("/", authenticateToken, getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a specific order by ID
 *     description: Get a specific order by ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: Order by ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 _id: "orderId"
 *                 items:
 *                   - product:
 *                       name: "Product name"
 *                       slug: "product-slug"
 *                       images: ["https://.../image.jpg"]
 *                       price: 100
 *                     quantity: 1
 *                     price: 100
 */
router.get("/:id", authenticateToken, getOrderById);

export default router;
