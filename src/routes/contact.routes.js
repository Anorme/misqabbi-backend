import express from "express";
import { submitContact } from "../controllers/contact.controller.js";
import { validateContact } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact form
 *     description: Submit a contact form message that will be sent as an email to the configured EMAIL_FROM address
 *     tags:
 *       - Contact
 *     requestBody:
 *       description: Contact form data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the person submitting the contact form
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the person submitting the contact form
 *                 example: "user@example.com"
 *               message:
 *                 type: string
 *                 description: The message content
 *                 example: "I would like to inquire about your products."
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
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
 *                   example: "Contact form submitted successfully"
 *       400:
 *         description: Invalid form data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["\"name\" is required", "\"email\" must be a valid email"]
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
 *                   example: "Failed to submit contact form"
 */
router.post("/", validateContact, submitContact);

export default router;
