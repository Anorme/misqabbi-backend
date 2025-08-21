import express from "express";

import {
  getCurrentUser,
  handleGoogleCallback,
  loginUser,
  registerUser,
} from "../controllers/users.controller.js";
import passport from "passport";
import { validateUser } from "../middleware/validator.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Registers a new user with email, password, and optional displayName
 *     description: Registers a new user with email, password, and optional displayName
 *     tags:
 *       - Users
 *     requestBody:
 *       description: User data to create
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 */
router.post("/signup", validateUser, registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticates a user and issues a signed JWT
 *     description: Authenticates a user and issues a signed JWT
 *     tags:
 *       - Users
 *     requestBody:
 *       description: User credentials to authenticate
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /google:
 *   get:
 *     summary: Initiates Google OAuth login flow
 *     description: Initiates Google OAuth login flow
 *     tags:
 *       - Users
 *     responses:
 *       302:
 *         description: Redirects to Google's consent screen
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /google/callback:
 *   get:
 *     summary: Handles Google OAuth callback and issues token
 *     description: Handles Google OAuth callback and issues token
 *     tags:
 *       - Users
 *     responses:
 *       302:
 *         description: Redirects to frontend with token in query string
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleGoogleCallback
);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Retrieves the currently authenticated user
 *     description: Retrieves the currently authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 */
router.get("/me", authenticateToken, getCurrentUser);

export default router;
