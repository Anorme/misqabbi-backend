import User from "./user.mongo.js";

import logger from "../config/logger.js";
import Product from "./product.mongo.js";

async function getCart(userId) {
  try {
    const user = await User.findById(userId).select("cartItems").populate({
      path: "cartItems.productId",
      select: "name price images stock",
    });

    if (!user) throw new Error("User not found");

    return user.cartItems || [];
  } catch (error) {
    logger.error(
      `[cart.model] Error fetching user ${userId} cart: ${error.message}`
    );
  }
}

async function addToCart(userId, productId, quantity) {
  // Validate product exists
  try {
    if (quantity < 1) throw new Error("Quantity must be at least 1");

    const product =
      await Product.findById(productId).select("stock isPublished");
    if (!product || !product.isPublished)
      throw new Error("Product is unavailable");

    if (product.stock < quantity)
      throw new Error("Not enough stock for requested quantity");

    const user = await User.findById(userId);

    const index = user.cartItems.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index !== -1) {
      user.cartItems[index].quantity += quantity;
    } else {
      user.cartItems.push({ productId, quantity });
    }

    await user.save();

    return user.cartItems;
  } catch (error) {
    logger.error(`[cart.model] Error adding product to cart: ${error.message}`);
  }
}

async function updateCartItem(userId, productId, quantity) {
  try {
    if (typeof quantity !== "number")
      throw new Error("Quantity must be a number");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const index = user.cartItems.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index === -1) throw new Error("Product not found in cart");

    if (quantity <= 0) {
      user.cartItems.splice(index, 1);
    } else {
      const product = await Product.findById(productId).select("stock");
      if (!product || product.stock < quantity) {
        throw new Error("Insufficient stock for requested quantity");
      }
      user.cartItems[index].quantity = quantity;
    }

    await user.save();
    return user.cartItems;
  } catch (error) {
    logger.error(
      `[cart.model] Error updating cart product:${productId} : ${error.message}`
    );
  }
}

async function removeFromCart(userId, productId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const index = user.cartItems.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index === -1) throw new Error("Product not found in cart");
    user.cartItems.splice(index, 1);

    await user.save();

    return user.cartItems;
  } catch (error) {
    logger.error(
      `[cart.model] Error removing item:${productId} 1from cart: ${error.message}`
    );
  }
  // Filter out cart item
  // Save user
}

export { getCart, addToCart, updateCartItem, removeFromCart };
