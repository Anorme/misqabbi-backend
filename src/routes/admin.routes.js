import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";

const router = express.Router();

// TODO: Replace placeholder with real admin dashboard logic
router.get("/dashboard", authenticateToken, checkAdmin, (req, res) => {
  res.status(200).json({ message: "Admin dashboard placeholder" });
});

export default router;
