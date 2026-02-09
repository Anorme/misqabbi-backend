import logger from "../config/logger.js";
import {
  createDiscount,
  findDiscountById,
  getPaginatedDiscounts,
  countDiscounts,
  updateDiscount,
  deactivateDiscount,
  codeExists,
  getDiscountStats,
} from "../models/discount.model.js";
import {
  getUsageByDiscount,
  countUsageByDiscount,
  getUsageStats,
} from "../models/discountUsage.model.js";
import {
  validateDiscountCode,
  formatDiscountDescription,
} from "../services/discountService.js";
import {
  generateUniqueDiscountCode,
  validateCodeFormat,
  normalizeCode,
} from "../utils/discountCodeGenerator.js";
import {
  validateProductIds,
  validateCategories,
} from "../models/product.model.js";

// User

/**
 * Validate a discount code for the current user.
 * POST /discounts/validate
 *
 * Expects body:
 * - code: string (required) - The discount code to validate
 * - cartTotal: number (required) - Current cart total in GHS
 * - itemCount: number (required) - Number of items in cart
 * - items: array (optional) - Cart items with product info for product-scoped discounts
 */
export async function validateDiscountHandler(req, res) {
  try {
    const { code, cartTotal, itemCount, items } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Discount code is required",
      });
    }

    if (cartTotal === undefined || cartTotal === null) {
      return res.status(400).json({
        success: false,
        error: "Cart total is required",
      });
    }

    if (itemCount === undefined || itemCount === null) {
      return res.status(400).json({
        success: false,
        error: "Item count is required",
      });
    }

    if (cartTotal < 0) {
      return res.status(400).json({
        success: false,
        error: "Cart total cannot be negative",
      });
    }

    if (itemCount < 0) {
      return res.status(400).json({
        success: false,
        error: "Item count cannot be negative",
      });
    }

    const userId = req.user._id;

    const cartData = {
      cartTotal: parseFloat(cartTotal),
      itemCount: parseInt(itemCount),
      items: items || [],
    };

    const result = await validateDiscountCode(code, userId, cartData);

    if (!result.valid) {
      logger.info(
        `[discount.controller] Discount validation failed for user ${userId}: ${result.errorCode}`
      );

      return res.status(400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.message,
      });
    }

    // Format response with user-friendly discount description
    const discountDescription = formatDiscountDescription(result.discount);

    logger.info(
      `[discount.controller] Discount ${code} validated successfully for user ${userId}`
    );

    return res.status(200).json({
      success: true,
      message: "Discount code is valid",
      data: {
        code: result.discount.code,
        description: result.discount.description || discountDescription,
        discountType: result.discount.discountType,
        discountValue: result.discount.discountValue,
        discountAmount: result.discountAmount,
        originalTotal: cartData.cartTotal,
        finalTotal: result.finalTotal,
        savings: discountDescription,
      },
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error validating discount: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to validate discount code",
    });
  }
}

// Admin
/**
 * Create a new discount code.
 * POST /admin/discounts
 */
export async function createDiscountAdmin(req, res) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      scope,
      applicableProducts,
      applicableCategories,
      usageType,
      maxGlobalUses,
      maxUsesPerUser,
      minOrderValue,
      minItemCount,
      firstOrderOnly,
      expiryDate,
      isActive,
    } = req.body;

    // Validate required fields
    if (!discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: "discountType, discountValue, and expiryDate are required",
      });
    }

    // Validate discount code if provided
    let finalCode = code;
    if (code) {
      const validation = validateCodeFormat(code);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.message,
        });
      }
      finalCode = normalizeCode(code);

      // Check if code already exists
      const exists = await codeExists(finalCode);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: "Discount code already exists",
        });
      }
    } else {
      // Generate a unique code if not provided
      finalCode = await generateUniqueDiscountCode();
    }

    // Validate expiry date
    const expiryDateObj = new Date(expiryDate);
    if (expiryDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        error: "Expiry date must be in the future",
      });
    }

    // Validate product-scoped discounts
    let validatedProducts = [];
    let validatedCategories = [];

    if (scope === "products") {
      const hasProducts =
        Array.isArray(applicableProducts) && applicableProducts.length > 0;
      const hasCategories =
        Array.isArray(applicableCategories) && applicableCategories.length > 0;

      // Require at least one of products or categories
      if (!hasProducts && !hasCategories) {
        return res.status(400).json({
          success: false,
          error:
            "Product-scoped discounts require at least one product ID or category",
        });
      }

      // Validate product IDs if provided
      if (hasProducts) {
        const productValidation = await validateProductIds(applicableProducts);

        if (productValidation.invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid product ID format: ${productValidation.invalidIds.join(", ")}`,
          });
        }

        if (productValidation.missingIds.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Products not found: ${productValidation.missingIds.join(", ")}`,
          });
        }

        validatedProducts = applicableProducts;
      }

      // Validate categories if provided
      if (hasCategories) {
        const categoryValidation =
          await validateCategories(applicableCategories);

        if (categoryValidation.normalizedCategories.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid category format",
          });
        }

        if (categoryValidation.invalidCategories.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Categories not found: ${categoryValidation.invalidCategories.join(", ")}`,
          });
        }

        validatedCategories = categoryValidation.normalizedCategories;
      }
    }

    // Build discount data
    const discountData = {
      code: finalCode,
      description: description || "",
      discountType,
      discountValue,
      maxDiscountAmount: maxDiscountAmount || null,
      scope: scope || "order",
      applicableProducts: validatedProducts,
      applicableCategories: validatedCategories,
      usageType: usageType || "multi_use",
      maxGlobalUses: maxGlobalUses || null,
      maxUsesPerUser: maxUsesPerUser || 1,
      minOrderValue: minOrderValue || null,
      minItemCount: minItemCount || null,
      firstOrderOnly: firstOrderOnly || false,
      expiryDate: expiryDateObj,
      isActive: isActive !== undefined ? isActive : true,
    };

    const discount = await createDiscount(discountData, req.user._id);

    logger.info(
      `[discount.controller] Discount created: ${discount.code} by admin ${req.user._id}`
    );

    return res.status(201).json({
      success: true,
      message: "Discount code created successfully",
      data: discount,
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error creating discount: ${error.message}`
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Discount code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create discount code",
    });
  }
}

/**
 * Get paginated list of discounts.
 * GET /admin/discounts
 */
export async function getDiscountsAdmin(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const params = {};

    // Filter by active status
    if (req.query.isActive !== undefined) {
      params.isActive = req.query.isActive === "true";
    }

    // Filter by scope
    if (req.query.scope && ["order", "products"].includes(req.query.scope)) {
      params.scope = req.query.scope;
    }

    // Filter by usage type
    if (
      req.query.usageType &&
      ["single_use", "multi_use", "per_user"].includes(req.query.usageType)
    ) {
      params.usageType = req.query.usageType;
    }

    // Filter by expiry status
    if (req.query.expired !== undefined) {
      params.expired = req.query.expired === "true";
    }

    // Search query
    if (req.query.q) {
      params.q = req.query.q;
    }

    const [discounts, total] = await Promise.all([
      getPaginatedDiscounts(page, limit, params),
      countDiscounts(params),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: discounts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error fetching discounts: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to fetch discounts",
    });
  }
}

/**
 * Get a single discount by ID with usage stats.
 * GET /admin/discounts/:id
 */
export async function getDiscountByIdAdmin(req, res) {
  try {
    const { id } = req.params;

    const discount = await findDiscountById(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: "Discount not found",
      });
    }

    // Get usage statistics
    const usageStats = await getUsageStats(id);

    return res.status(200).json({
      success: true,
      data: {
        ...discount.toObject(),
        usageStats,
      },
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error fetching discount: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to fetch discount",
    });
  }
}

/**
 * Update a discount by ID.
 * PUT /admin/discounts/:id
 */
export async function updateDiscountAdmin(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if discount exists
    const existingDiscount = await findDiscountById(id);
    if (!existingDiscount) {
      return res.status(404).json({
        success: false,
        error: "Discount not found",
      });
    }

    // Validate expiry date if provided
    if (updateData.expiryDate) {
      const expiryDateObj = new Date(updateData.expiryDate);
      if (isNaN(expiryDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid expiry date format",
        });
      }
      updateData.expiryDate = expiryDateObj;
    }

    // Determine the effective scope (updated or existing)
    const effectiveScope = updateData.scope ?? existingDiscount.scope;

    // Validate product-scoped discounts
    if (effectiveScope === "products") {
      const updatedProducts = updateData.applicableProducts;
      const updatedCategories = updateData.applicableCategories;

      // Check if updating products or categories
      const hasProductsUpdate = updatedProducts !== undefined;
      const hasCategoriesUpdate = updatedCategories !== undefined;

      // Determine final arrays (updated values or existing)
      const finalProducts = hasProductsUpdate
        ? updatedProducts
        : existingDiscount.applicableProducts;
      const finalCategories = hasCategoriesUpdate
        ? updatedCategories
        : existingDiscount.applicableCategories;

      const hasProducts =
        Array.isArray(finalProducts) && finalProducts.length > 0;
      const hasCategories =
        Array.isArray(finalCategories) && finalCategories.length > 0;

      // If scope is changing to products, require at least one target
      if (updateData.scope === "products" && !hasProducts && !hasCategories) {
        return res.status(400).json({
          success: false,
          error:
            "Product-scoped discounts require at least one product ID or category",
        });
      }

      // Validate product IDs if being updated
      if (hasProductsUpdate && hasProducts) {
        const productValidation = await validateProductIds(finalProducts);

        if (productValidation.invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid product ID format: ${productValidation.invalidIds.join(", ")}`,
          });
        }

        if (productValidation.missingIds.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Products not found: ${productValidation.missingIds.join(", ")}`,
          });
        }

        updateData.applicableProducts = finalProducts;
      }

      // Validate categories if being updated
      if (hasCategoriesUpdate && hasCategories) {
        const categoryValidation = await validateCategories(finalCategories);

        if (categoryValidation.normalizedCategories.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid category format",
          });
        }

        if (categoryValidation.invalidCategories.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Categories not found: ${categoryValidation.invalidCategories.join(", ")}`,
          });
        }

        updateData.applicableCategories =
          categoryValidation.normalizedCategories;
      }
    } else if (updateData.scope === "order") {
      // Clear product-specific fields when switching to order scope
      updateData.applicableProducts = [];
      updateData.applicableCategories = [];
    }

    const discount = await updateDiscount(id, updateData);

    logger.info(
      `[discount.controller] Discount updated: ${discount.code} by admin ${req.user._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: discount,
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error updating discount: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to update discount",
    });
  }
}

/**
 * Soft delete (deactivate) a discount by ID.
 * DELETE /admin/discounts/:id
 */
export async function deleteDiscountAdmin(req, res) {
  try {
    const { id } = req.params;

    const discount = await deactivateDiscount(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: "Discount not found",
      });
    }

    logger.info(
      `[discount.controller] Discount deactivated: ${discount.code} by admin ${req.user._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Discount deactivated successfully",
      data: discount,
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error deleting discount: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to delete discount",
    });
  }
}

/**
 * Generate a random unique discount code.
 * POST /admin/discounts/generate-code
 */
export async function generateCodeAdmin(req, res) {
  try {
    const { prefix, segmentLength, segmentCount } = req.body;

    const options = {};
    if (prefix) options.prefix = prefix;
    if (segmentLength) options.segmentLength = parseInt(segmentLength);
    if (segmentCount) options.segmentCount = parseInt(segmentCount);

    const code = await generateUniqueDiscountCode(options);

    return res.status(200).json({
      success: true,
      data: { code },
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error generating code: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to generate discount code",
    });
  }
}

/**
 * Get usage history for a discount.
 * GET /admin/discounts/:id/usage
 */
export async function getDiscountUsageAdmin(req, res) {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    // Check if discount exists
    const discount = await findDiscountById(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: "Discount not found",
      });
    }

    const [usage, total] = await Promise.all([
      getUsageByDiscount(id, page, limit),
      countUsageByDiscount(id),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: usage,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error fetching discount usage: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to fetch discount usage",
    });
  }
}

/**
 * Get discount statistics for dashboard.
 * GET /admin/discounts/stats
 */
export async function getDiscountStatsAdmin(req, res) {
  try {
    const stats = await getDiscountStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(
      `[discount.controller] Error fetching discount stats: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Failed to fetch discount statistics",
    });
  }
}
