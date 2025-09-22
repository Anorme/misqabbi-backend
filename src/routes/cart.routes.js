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
 * @swagger
 * /cart:
 *   get:
 *     summary: Retrieve the current user's cart
 *     description: Retrieve the current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 */
router.get("/", authenticateToken, handleGetCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add an item to the user's cart
 *     description: Add an item to the user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product ID and quantity to add
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *     responses:
 *       201:
 *         description: Cart updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 */
router.post("/", authenticateToken, handleAddToCart);

/**
 * @swagger
 * /cart:
 *   put:
 *     summary: Update an item in the user's cart
 *     description: Update an item in the user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product ID and quantity to update
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Cart updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 */
router.put("/", authenticateToken, handleUpdateCartItem);

/**
 * @swagger
 * /cart/{productId}:
 *   delete:
 *     summary: Remove an item from the user's cart by product ID
 *     description: Remove an item from the user's cart by product ID
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *          $ref: '#/components/schemas/CartItem'
 *     responses:
 *       204:
 *         description: Item removed
 */
router.delete("/:productId", authenticateToken, handleRemoveFromCart);

export default router;
