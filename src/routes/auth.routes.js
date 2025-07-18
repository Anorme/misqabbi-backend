const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/users.model");

const router = express.Router();

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
