const express = require("express");
const router = express.Router();
const { authenticateToken, checkAdmin } = require("../middleware");

// TODO: Replace placeholder with real admin dashboard logic
router.get("/dashboard", authenticateToken, checkAdmin, (req, res) => {
  res.status(200).json({ message: "Admin dashboard placeholder" });
});

module.exports = router;
