import express from "express";

import { loginUser, registerUser } from "../controllers/users.controller.js";

const router = express.Router();

/**
 * @route   POST /signup
 * @desc    Maps signup request to controller
 * @access  Public
 *
 * - Delegates to registerUser controller for creation logic
 * - Controller handles validation, hashing, and response
 */
router.post("/signup", registerUser);

/**
 * @route   POST /login
 * @desc    Maps login request to controller
 * @access  Public
 *
 * - Delegates to loginUser controller for authentication
 * - Controller handles credential verification and token issuance
 */
router.post("/login", loginUser);

export default router;
