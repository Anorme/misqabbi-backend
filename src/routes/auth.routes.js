import express from "express";

import {
  handleGoogleCallback,
  loginUser,
  registerUser,
} from "../controllers/users.controller.js";
import passport from "passport";
import { validateUser } from "../middleware/validator.middleware.js";
import { validateUser } from "../middleware/validator.middleware.js";

const router = express.Router();

/**
 * @route   POST /signup
 * @desc    Maps signup request to controller
 * @access  Public
 *
 * - Delegates to registerUser controller for creation logic
 * - Controller handles validation, hashing, and response
 */
router.post("/signup", validateUser,registerUser);

/**
 * @route   POST /login
 * @desc    Maps login request to controller
 * @access  Public
 *
 * - Delegates to loginUser controller for authentication
 * - Controller handles credential verification and token issuance
 */
router.post("/login", loginUser);

/**
 * @route   GET /google
 * @desc    Initiates Google OAuth login flow
 * @access  Public
 *
 * - Redirects to Google's consent screen requesting profile and email access
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @route   GET /google/callback
 * @desc    Handles Google OAuth callback and issues token
 * @access  Public
 *
 * - Uses Passport to authenticate Google response
 * - Delegates token issuance and redirect to controller
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleGoogleCallback
);

export default router;
