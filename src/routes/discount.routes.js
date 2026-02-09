import express from "express";
import { authenticateToken } from "../middleware/index.js";
import { validateDiscountHandler } from "../controllers/discount.controller.js";

const router = express.Router();

/**
 * @swagger
 * /discounts/validate:
 *   post:
 *     summary: Validate a discount code
 *     description: Validate a discount code against the user's cart and return the calculated discount.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *               - itemCount
 *             properties:
 *               code:
 *                 type: string
 *                 description: The discount code to validate
 *                 example: "MISQ-SAVE20"
 *               cartTotal:
 *                 type: number
 *                 description: Current cart total in GHS
 *                 example: 150.00
 *               itemCount:
 *                 type: integer
 *                 description: Number of items in the cart
 *                 example: 3
 *               items:
 *                 type: array
 *                 description: Cart items (required for product-scoped discounts)
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: Product ID
 *                     price:
 *                       type: number
 *                       description: Product price
 *                     quantity:
 *                       type: integer
 *                       description: Quantity
 *                     category:
 *                       type: string
 *                       description: Product category
 *     responses:
 *       200:
 *         description: Discount code is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Discount code is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "MISQ-SAVE20"
 *                     description:
 *                       type: string
 *                       example: "20% off your order"
 *                     discountType:
 *                       type: string
 *                       enum: [percentage, fixed]
 *                       example: "percentage"
 *                     discountValue:
 *                       type: number
 *                       example: 20
 *                     discountAmount:
 *                       type: number
 *                       example: 30.00
 *                     originalTotal:
 *                       type: number
 *                       example: 150.00
 *                     finalTotal:
 *                       type: number
 *                       example: 120.00
 *                     savings:
 *                       type: string
 *                       example: "20% off"
 *       400:
 *         description: Invalid discount code or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errorCode:
 *                   type: string
 *                   example: "CODE_EXPIRED"
 *                 error:
 *                   type: string
 *                   example: "Discount code has expired"
 *       401:
 *         description: Unauthorized - user not logged in
 *       500:
 *         description: Server error
 */
router.post("/validate", authenticateToken, validateDiscountHandler);

export default router;
