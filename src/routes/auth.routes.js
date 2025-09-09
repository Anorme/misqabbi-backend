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
 * /auth/signup:
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *               displayName:
 *                 type: string
 *                 description: User's display name (optional)
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the user was created successfully
 *                 message:
 *                   type: string
 *                   description: Success or error message
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: Created user's ID
 *                     email:
 *                       type: string
 *                       description: Created user's email address
 *                     displayName:
 *                       type: string
 *                       description: Created user's display name (if provided)
 *       400:
 *         description: Invalid user credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the user was created successfully
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to create user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the user was created successfully
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post("/signup", validateUser, registerUser);

/**
 * @swagger
 * /auth/login:
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
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
 *                   description: Success message
 *                 token:
 *                   type: string
 *                   description: Signed JWT token
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: User's ID
 *                     email:
 *                       type: string
 *                       description: User's email address
 *                     displayName:
 *                       type: string
 *                       description: User's display name
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the user was authenticated successfully
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Token generation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the user was authenticated successfully
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /auth/google:
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
 * /auth/google/callback:
 *   get:
 *     summary: Handles Google OAuth callback and authenticates user
 *     description: Handles Google OAuth callback and authenticates user
 *     tags:
 *       - Users
 *     responses:
 *       302:
 *         description: Redirects to frontend with authentication cookie
 *       500:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the authentication was successful
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleGoogleCallback
);

/**
 * @swagger
 * /auth/me:
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
 *       401:
 *         description: User not authenticated
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
 */
router.get("/me", authenticateToken, getCurrentUser);

export default router;
