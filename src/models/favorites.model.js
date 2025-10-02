import User from "./user.mongo.js";

import logger from "../config/logger.js";
import Product from "./product.mongo.js";

async function getFavorites(userId) {
  try {
    const user = await User.findById(userId).select("favorites").populate({
      path: "favorites.productId",
      select: "name price images stock slug",
    });

    if (!user) throw new Error("User not found");

    const transformFavorites = (user.favorites || [])
      .filter(fav => fav.productId)
      .map(fav => ({
        productId: fav.productId._id,
        name: fav.productId.name,
        price: fav.productId.price,
        images: fav.productId.images,
        stock: fav.productId.stock,
        slug: fav.productId.slug,
      }));

    return transformFavorites;
  } catch (error) {
    logger.error(
      `[favorites.model] Error fetching user ${userId} favorites: ${error.message}`
    );
  }
}

async function addToFavorites(userId, productId) {
  // Validate product exists
  try {
    const product = await Product.findById(productId)
      .select("isPublished")
      .lean();
    if (!product || !product.isPublished)
      throw new Error("Product is unavailable");

    const user = await User.findById(userId);

    const index = user.favorites.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index !== -1) {
      return { productId, isFavorited: true };
    } else {
      user.favorites.push({ productId });
    }

    await user.save();

    return { productId, isFavorited: true };
  } catch (error) {
    logger.error(
      `[favorites.model] Error adding product to favorites: ${error.message}`
    );
  }
}

async function removeFromFavorites(userId, productId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const index = user.favorites.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index === -1) throw new Error("Product not found in favorites");
    user.favorites.splice(index, 1);

    await user.save();

    return { productId, isFavorited: false };
  } catch (error) {
    logger.error(
      `[favorites.model] Error removing item:${productId} from favorites: ${error.message}`
    );
  }
  // Filter out favorites item
  // Save user
}

async function toggleFavorite(userId, productId) {
  try {
    const user = await User.findById(userId);
    const product = await Product.findById(productId)
      .select("isPublished")
      .lean();
    if (!product || !product.isPublished)
      throw new Error("Product is unavailable");
    if (!user) throw new Error("User not found");
    const index = user.favorites.findIndex(item =>
      item.productId.equals(productId)
    );
    if (index !== -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push({ productId });
    }
    await user.save();
    return {
      productId,
      isFavorited: user.favorites.some(item =>
        item.productId.equals(productId)
      ),
    };
  } catch (error) {
    logger.error(`[favorites.model] Error toggling favorite: ${error.message}`);
  }
}

async function isFavorited(userId, productId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return {
      productId,
      isFavorited: user.favorites.some(item =>
        item.productId.equals(productId)
      ),
    };
  } catch (error) {
    logger.error(
      `[favorites.model] Error checking if product is favorited: ${error.message}`
    );
  }
}

export {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  isFavorited,
};
