import express from "express";
import { authenticateToken } from "../middleware/index.js";
import {
  initializeCheckout,
  getOrders,
  getOrderById,
} from "../controllers/orders.controller.js";
import { validateOrder } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Initialize checkout process with Paystack payment
 *     description: Initializes a Paystack transaction for order checkout. Returns payment URL for frontend redirect.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: expressService
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Opt-in for express service (150 GHS per product piece)
 *     requestBody:
 *       description: Order data for checkout
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: Product ID
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                     size:
 *                       type: string
 *                       enum: [XS, S, M, L, XL, XXL, CUSTOM]
 *                     customSize:
 *                       type: object
 *                       description: Required when size is CUSTOM
 *               shippingInfo:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   deliveryAddress:
 *                     type: string
 *                   deliveryNotes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                       description: Paystack payment URL
 *                     reference:
 *                       type: string
 *                       description: Transaction reference
 *                     amount:
 *                       type: number
 *                       description: Amount in Ghana Cedis
 *                     currency:
 *                       type: string
 *                       example: GHS
 *       400:
 *         description: Bad request (empty cart, invalid products, etc.)
 *       500:
 *         description: Server error
 */
router.post("/checkout", validateOrder, authenticateToken, initializeCheckout);

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
