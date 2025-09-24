import express from "express";

import {
  handleAddToFavorites,
  handleGetFavorites,
  handleRemoveFromFavorites,
  handleIsFavorited,
  handleToggleFavorite,
} from "../controllers/favorites.controller.js";
import { authenticateToken } from "../middleware/index.js";

const router = express.Router();

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Retrieve the current user's favorites
 *     description: Retrieve the current user's favorites
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoritesItem'
 */
router.get("/", authenticateToken, handleGetFavorites);

/**
 * @swagger
 * /favorites/check/{productId}:
 *   get:
 *     summary: Check if a product is in the user's favorites
 *     description: Returns whether the specified product is in the current user's favorites.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to check
 *     responses:
 *       200:
 *         description: Whether the product is favorited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 *                   description: Indicates if the product is in the user's favorites
 */

router.get("/check/:productId", authenticateToken, handleIsFavorited);

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add an item to the user's favorites
 *     description: Add an item to the user's favorites
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product ID to add
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoritesItem'
 *     responses:
 *       201:
 *         description: Favorites updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoritesItem'
 */
router.post("/", authenticateToken, handleAddToFavorites);

/**
 * @swagger
 * /favorites/{productId}:
 *   delete:
 *     summary: Remove an item from the user's favorites by product ID
 *     description: Remove an item from the user's favorites by product ID
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *          $ref: '#/components/schemas/FavoritesItem'
 *     responses:
 *       204:
 *         description: Item removed
 */
router.delete("/:productId", authenticateToken, handleRemoveFromFavorites);

/**
 * @swagger
 * /favorites/{productId}/is-favorited:
 *   get:
 *     summary: Check if a product is in the user's favorites
 *     description: Returns whether the specified product is favorited by the authenticated user
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to check
 *     responses:
 *       200:
 *         description: Favorited status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFavorited:
 *                       type: boolean
 *       400:
 *         description: Missing productId in request
 *       500:
 *         description: Failed to check if product is favorited
 */
router.get("/:productId/is-favorited", authenticateToken, handleIsFavorited);

router.patch("/toggle/:productId", authenticateToken, handleToggleFavorite);

export default router;
