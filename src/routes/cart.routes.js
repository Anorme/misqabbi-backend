import express from "express";

import {
  handleAddToCart,
  handleGetCart,
  handleRemoveFromCart,
  handleUpdateCartItem,
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/index.js";

const router = express.Router();

router.get("/", authenticateToken, handleGetCart);

router.post("/", authenticateToken, handleAddToCart);

router.put("/", authenticateToken, handleUpdateCartItem);

router.delete("/:productId", authenticateToken, handleRemoveFromCart);

export default router;
