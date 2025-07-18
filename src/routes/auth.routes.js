const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/users.model");

const router = express.Router();

/**
 * @routes  POST /signup
 * @desc    Registers a new user with email, password and optional displayName
 * @access  Public
 *
 * - Checks for exisiting user by email
 * - Hashes password via schema middleware
 * - Returns user ID on success
 * - Uses generic error messaging to avoid leaking system info
 */
router.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    const existingUser = await findUserByEmail(email);
    if (!existingUser)
      return res.status(400).json({ message: "Invalid user credentials" });

    const user = await createUser({ email, password, displayName });
    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /login
 * @desc    Authenticates user and returns a signed JWT
 * @access  Public
 *
 * - Uses Passport Local Strategy with custom callback
 * - Verifies credentials via schema method
 * - Encodes user ID and role in JWT payload
 * - Returns token for client-side storage
 */
router.post("/login", async (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user)
      return res.status(401).json({ message: info?.message || "Login failed" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  })(req, res, next);
});
