import logger from "../config/logger.js";

import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
} from "../models/cart.model.js";

async function handleGetCart(req, res) {
  try {
    const cart = await getCart(req.user.id);
    res.status(200).json({ cart });
  } catch (error) {
    logger.error(`[handleGetCart] Error getting user cart: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve cart" });
  }
}

async function handleAddToCart(req, res) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ error: "Missing productId or quantity" });
    }
    const updatedCart = await addToCart(req.user.id, productId, quantity);
    res.status(200).json({ cart: updatedCart });
  } catch (error) {
    logger.error(
      `[handleAddToCart] Failed to add item to cart: ${error.message}`
    );
    res.status(500).json({ error: "Failed to add item to cart" });
  }
}

async function handleUpdateCartItem(req, res) {
  try {
    const { productId, quantity } = req.body;

    const parsedQuantity = Number(quantity);
    if (!productId || isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const updatedCart = await updateCartItem(
      req.user.id,
      productId,
      parsedQuantity
    );
    res.status(200).json({ cart: updatedCart });
  } catch (error) {
    logger.error(
      `[handleUpdateCartItem] Error updating cart: ${error.message}`
    );
    res.status(500).json({ error: "Failed to update cart item" });
  }
}

async function handleRemoveFromCart(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: "Missing productId in request" });
    }

    const updatedCart = await removeFromCart(req.user.id, productId);
    res.status(200).json({ cart: updatedCart });
  } catch (error) {
    logger.error(
      `[handleRemoveFromCart] Error removing item: ${error.message}`
    );
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
}

export {
  handleGetCart,
  handleAddToCart,
  handleUpdateCartItem,
  handleRemoveFromCart,
};
