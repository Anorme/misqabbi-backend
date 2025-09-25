import logger from "../config/logger.js";

import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  isFavorited,
} from "../models/favorites.model.js";

import { formatResponse } from "../utils/responseFormatter.js";

async function handleGetFavorites(req, res) {
  try {
    const favoriteStatus = await getFavorites(req.user.id);
    res.status(200).json(
      formatResponse({
        message: "Favorites retrieved successfully",
        data: favoriteStatus,
      })
    );
  } catch (error) {
    logger.error(
      `[handleGetFavorites] Error getting user favorites: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to retrieve favorites",
      })
    );
  }
}

async function handleAddToFavorites(req, res) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json(
        formatResponse({
          success: false,
          message: "Missing productId",
        })
      );
    }
    const favoriteStatus = await addToFavorites(req.user.id, productId);
    res.status(200).json(
      formatResponse({
        message: "Favorites updated successfully",
        data: favoriteStatus,
      })
    );
  } catch (error) {
    logger.error(
      `[handleAddToFavorites] Failed to add item to favorites: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to add item to favorites",
      })
    );
  }
}

async function handleRemoveFromFavorites(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json(
        formatResponse({
          success: false,
          message: "Missing productId in request",
        })
      );
    }

    const favoriteStatus = await removeFromFavorites(req.user.id, productId);
    res.status(200).json(
      formatResponse({
        message: "Favorites updated successfully",
        data: favoriteStatus,
      })
    );
  } catch (error) {
    logger.error(
      `[handleRemoveFromFavorites] Error removing item: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to remove item from favorites",
      })
    );
  }
}

async function handleToggleFavorite(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json(
        formatResponse({
          success: false,
          message: "Missing productId in request",
        })
      );
    }
    const favoriteStatus = await toggleFavorite(req.user.id, productId);
    res.status(200).json(
      formatResponse({
        message: "Favorites updated successfully",
        data: favoriteStatus,
      })
    );
  } catch (error) {
    logger.error(
      `[handleToggleFavorite] Error toggling favorite: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to toggle favorite",
      })
    );
  }
}

async function handleIsFavorited(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json(
        formatResponse({
          success: false,
          message: "Missing productId in request",
        })
      );
    }
    const favoriteStatus = await isFavorited(req.user.id, productId);
    res.status(200).json(
      formatResponse({
        message: "Product is favorited",
        data: favoriteStatus,
      })
    );
  } catch (error) {
    logger.error(
      `[handleIsFavorited] Error checking if product is favorited: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        message: "Failed to check if product is favorited",
      })
    );
  }
}

export {
  handleGetFavorites,
  handleAddToFavorites,
  handleRemoveFromFavorites,
  handleToggleFavorite,
  handleIsFavorited,
};
