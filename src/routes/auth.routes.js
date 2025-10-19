import express from "express";

import {
  forgotPassword,
  getCurrentUser,
  handleGoogleCallback,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUserProfile,
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logs out a user and invalidates their authentication cookie
 *     description: Logs out a user and invalidates their authentication cookie
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out
 */
router.post("/logout", logoutUser);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Initiates the password reset process for a user by sending a reset link to their email
 *     description: Initiates the password reset process for a user by sending a reset link to their email
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Email address of the user requesting a password reset
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the password reset email was sent successfully
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Failed to send password reset email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the password reset email was sent successfully
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: string
 *                   description: Error message
 */

router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{userId}/{token}:
 *   post:
 *     summary: Resets a user's password using a valid reset token
 *     description: Resets a user's password using a valid reset token
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user resetting their password
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       description: New password for the user
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the password was reset successfully
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the password was reset successfully
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to reset password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the password was reset successfully
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post("/reset-password/:userId/:token", resetPassword);

/** * @swagger
 * /auth/update-profile:
 *   post:
 *    summary: Update the profile of the currently authenticated user
 *   description: Update the profile of the currently authenticated user
 *   tags:
 *    - Users
 *  security:
 *    - bearerAuth: []
 *  requestBody:
 *    description: Profile data to update
 *   required: true
 *  content:
 *    application/json:
 *     schema:
 *      type: object
 *     properties:
 *      displayName:
 *      type: string
 *      description: New display name for the user
 *     contact:
 *    type: string
 *   description: New contact information for the user
 *    location:
 *    type: string
 *  description: New location information for the user
 *   responses:
 *    200:
 *    description: User profile updated successfully
 *
 *   content:
 *    application/json:
 *   schema:
 *    type: object
 *   properties:
 *    success:
 *    type: boolean
 *   description: Indicates whether the profile was updated successfully
 *   message:
 *   type: string
 *  description: Success message
 *      data:
 *      type: object
 *     properties:
 *      userId:
 *      type: string
 *    description: User's ID
 *   email:
 *    type: string
 *  description: User's email address
 * displayName:
 *   type: string
 * description: User's display name
 *      contact:
 *     type: string
 *   description: User's contact information
 *    location:
 *    type: string
 *  description: User's location information
 *      400:
 *    description: Invalid profile data
 *   content:
 *   application/json:
 *   schema:
 *   type: object
 *  properties:
 *   success:
 *  type: boolean
 *  description: Indicates whether the profile was updated successfully
 *  example: false
 *  message:
 *  type: string
 * description: Error message
 *    500:
 *  description: Failed to update user profile
 *  content:
 *  application/json:
 *  schema:
 *  type: object
 * properties:
 *  success:
 *  type: boolean
 * description: Indicates whether the profile was updated successfully
 * example: false
 * message:
 * type: string
 * description: Error message
 * error:
 * type: string
 * description: Error message
 */
router.post("/update-profile", authenticateToken, updateUserProfile);

export default router;
