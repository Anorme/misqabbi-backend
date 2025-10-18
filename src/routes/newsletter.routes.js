import express from "express";
import { subscribeNewsletter } from "../controllers/newsletter.controller.js";
import { validateNewsletter } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /newsletter/subscribe:
 *   post:
 *     summary: Subscribe an email to the newsletter
 *     description: Subscribe an email address to the Misqabbi newsletter via Mailchimp
 *     tags:
 *       - Newsletter
 *     requestBody:
 *       description: Email address to subscribe
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to subscribe to newsletter
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Successfully subscribed to newsletter
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
 *                   example: "Successfully subscribed to newsletter"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Mailchimp member ID
 *                     email:
 *                       type: string
 *                       description: Subscribed email address
 *                     status:
 *                       type: string
 *                       description: Subscription status
 *       400:
 *         description: Email already subscribed or invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email already subscribed"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to subscribe to newsletter"
 */
router.post("/subscribe", validateNewsletter, subscribeNewsletter);

export default router;
