import express from "express";
import {
  handlePaystackWebhook,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @swagger
 * /payment/webhook/paystack:
 *   post:
 *     summary: Paystack webhook endpoint
 *     description: Handles Paystack webhook events for payment verification. This endpoint is called by Paystack when payment events occur.
 *     tags:
 *       - Payment
 *     security: []
 *     requestBody:
 *       description: Paystack webhook payload
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event type (charge.success, charge.failed, etc.)
 *               data:
 *                 type: object
 *                 description: Event data containing transaction details
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (invalid signature, missing data)
 *       500:
 *         description: Server error
 */
router.post("/webhook/paystack", handlePaystackWebhook);

/**
 * @swagger
 * /payment/verify/{reference}:
 *   get:
 *     summary: Verify payment status
 *     description: Manually verify payment status for a given transaction reference. Useful for frontend payment confirmation.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference from Paystack
 *     responses:
 *       200:
 *         description: Payment status retrieved
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
 *                     transaction:
 *                       type: object
 *                       description: Transaction details
 *                     order:
 *                       type: object
 *                       description: Created order (if payment successful)
 *       400:
 *         description: Bad request (missing reference)
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get("/verify/:reference", verifyPayment);

export default router;
