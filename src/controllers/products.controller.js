import {
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getDiscoverableProducts,
  countDiscoverableProducts,
  getPaginatedAllProducts,
  countAllProducts,
  getRelatedProducts,
  getProductVariants,
  createVariantProduct,
  removeVariantFromProduct,
} from "../models/product.model.js";
import { deleteAssets } from "../config/cloudinary.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { isValidSortOption } from "../utils/validators.js";

/**
 * Retrieves a paginated list of discoverable (published, filtered, and/or searched) products.
 * @async
 * @function getProducts
 * @param {Request} req - Express request object with optional query params: q, category, minPrice, maxPrice, page, limit, sort
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with product data, total count, total pages, and current page
 */
export async function getProducts(req, res) {
  try {
    const { q, category, minPrice, maxPrice, page, limit, sort } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);

    // Validate sort parameter
    if (sort && !isValidSortOption(sort)) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error:
            "Invalid sort option. Valid options are: latest, price-low-high, price-high-low, name-a-z, name-z-a",
        })
      );
    }

    const filters = {
      q: q?.trim() || undefined,
      category: category?.trim() || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort?.trim() || undefined,
    };

    const total = await countDiscoverableProducts(filters);

    if (pageNum > Math.ceil(total / limitNum) && total > 0) {
      return res.status(400).json({
        success: false,
        error: "Requested page exceeds available product pages",
      });
    }
    const products = await getDiscoverableProducts(filters, pageNum, limitNum);

    res.status(200).json(
      formatResponse({
        data: products,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    logger.error(
      `[products.controller] Failed to fetch products: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load products",
      })
    );
  }
}

/**
 * Retrieves a single published product by its ID.
 * @async
 * @function getProductByIdHandler
 * @param {Request} req - Express request object with path param: id
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with product data or error
 */

export async function getProductByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product || !product.isPublished) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }
    res.json(formatResponse({ data: product }));
  } catch (error) {
    logger.error(
      `[products.controller] Error getting product ${req.params.id}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load product ",
      })
    );
  }
}

export const getProductBySlugHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const includeRelated = req.query.includeRelated === "true";

    const product = await getProductBySlug(slug);
    if (!product || !product.isPublished) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }

    // Product is already a plain object from .lean(), so we can directly add properties
    const responseData = { ...product };

    // Always include variants for base products (not variants themselves)
    if (!product.isVariant) {
      const variants = await getProductVariants(product._id);
      responseData.variants = variants;
    }

    // Only include related products if query parameter is explicitly set to "true"
    if (includeRelated) {
      const relatedProducts = await getRelatedProducts(product, 4);
      responseData.relatedProducts = relatedProducts;
    }

    res.status(200).json(formatResponse({ data: responseData }));
  } catch (error) {
    logger.error(
      `[products.controller] Error getting product by slug ${req.params.slug}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load product by slug",
      })
    );
  }
};

/**
 * Creates a new product using request body data (admin only).
 * @async
 * @function createProductAdmin
 * @route POST /admin/products
 * @access Admin
 * @param {Request} req - Express request object with product data in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with created product or error
 */
export async function createProductAdmin(req, res) {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const product = await createProduct(data);
    res.status(201).json(
      formatResponse({
        message: "Product created successfully",
        data: product,
      })
    );
  } catch (error) {
    logger.error(
      `[products.controller] Error creating product: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        message: "Product creation failed",
        error: "Invalid product data",
      })
    );
  }
}

/**
 * Updates an existing product by ID using request body data (admin only).
 * @async
 * @function updateProductAdmin
 * @route PUT /admin/products/:id
 * @access Admin
 * @param {Request} req - Express request object with path param: id and update data in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with updated product or error
 */
export async function updateProductAdmin(req, res) {
  try {
    const { id } = req.params;
    const existing = await getProductById(id);
    if (!existing) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }
    const payload = { ...req.body };
    // If images are provided, compute diff and delete removed images
    if (Array.isArray(payload.images)) {
      const incoming = payload.images.map(img =>
        typeof img === "string" ? { url: img } : img
      );
      const existingByPublicId = new Map(
        (existing.images || [])
          .filter(img => typeof img !== "string" && img?.publicId)
          .map(img => [img.publicId, img])
      );
      const incomingPublicIds = new Set(
        incoming.filter(img => img && img.publicId).map(img => img.publicId)
      );
      const removedPublicIds = Array.from(existingByPublicId.keys()).filter(
        pid => !incomingPublicIds.has(pid)
      );
      if (removedPublicIds.length > 0) {
        try {
          await deleteAssets(removedPublicIds);
        } catch (err) {
          logger.warn(
            `[products.controller] Failed to delete some Cloudinary assets on update for product ${id}: ${err.message}`
          );
        }
      }
      payload.images = incoming;
    }

    const product = await updateProduct(id, payload);
    res.json(
      formatResponse({ message: "Product updated successfully", data: product })
    );
  } catch (error) {
    logger.error(
      `[products.controller] Product update failed: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: "Product update failed",
      })
    );
  }
}

/**
 * Deletes a product by its ID (admin only).
 * @async
 * @function deleteProductAdmin
 * @route DELETE /admin/products/:id
 * @access Admin
 * @param {Request} req - Express request object with path param: id
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 204 status or error response
 */
export async function deleteProductAdmin(req, res) {
  try {
    const { id } = req.params;
    // Fetch product to gather Cloudinary publicIds
    const existing = await getProductById(id);
    if (!existing) {
      return res
        .status(404)
        .json(formatResponse({ success: false, error: "Product not found" }));
    }
    const publicIds = Array.isArray(existing.images)
      ? existing.images
          .map(img => (typeof img === "string" ? null : img?.publicId))
          .filter(Boolean)
      : [];
    if (publicIds.length > 0) {
      try {
        await deleteAssets(publicIds);
      } catch (err) {
        logger.warn(
          `[products.controller] Failed to delete some Cloudinary assets for product ${id}: ${err.message}`
        );
      }
    }
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }
    res.status(204).send();
  } catch (error) {
    logger.error(
      `[products.controller] Product deletion failed: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: "Product deletion failed",
      })
    );
  }
}

/**
 * Retrieves a paginated list of all products including unpublished (admin only).
 * @async
 * @function getProductsAdmin
 * @route GET /admin/products
 * @access Admin
 * @param {Request} req - Express request object with optional query params: q, category, minPrice, maxPrice, isPublished, page, limit, sort
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with product data, total count, total pages, and current page
 */
export async function getProductsAdmin(req, res) {
  try {
    const { q, category, minPrice, maxPrice, isPublished, page, limit, sort } =
      req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);

    // Validate sort parameter
    if (sort && !isValidSortOption(sort)) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error:
            "Invalid sort option. Valid options are: latest, price-low-high, price-high-low, name-a-z, name-z-a",
        })
      );
    }

    const filters = {
      q: q?.trim() || undefined,
      category: category?.trim() || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isPublished:
        isPublished === "true"
          ? true
          : isPublished === "false"
            ? false
            : isPublished === "all"
              ? "all"
              : undefined,
      sort: sort?.trim() || undefined,
    };

    const total = await countAllProducts(filters);

    if (pageNum > Math.ceil(total / limitNum) && total > 0) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Requested page exceeds available product pages",
        })
      );
    }

    const products = await getPaginatedAllProducts(filters, pageNum, limitNum);

    res.status(200).json(
      formatResponse({
        message: "Products fetched successfully",
        data: products,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    logger.error(
      `[products.controller] Failed to fetch all products: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load products",
      })
    );
  }
}

/**
 * Get all variants for a product (admin only)
 * @async
 * @function getProductVariantsAdmin
 * @route GET /admin/products/:id/variants
 * @access Admin
 * @param {Request} req - Express request object with path param: id
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with variant products array
 */
export async function getProductVariantsAdmin(req, res) {
  const { id } = req.params;
  try {
    const variants = await getProductVariants(id);
    res.json(formatResponse({ data: variants }));
  } catch (error) {
    logger.error(
      `[products.controller] Error fetching variants for product ${id}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to fetch variants",
      })
    );
  }
}

/**
 * Create a variant product (admin only)
 * @async
 * @function createVariantProductAdmin
 * @route POST /admin/products/:baseProductId/variants
 * @access Admin
 * @param {Request} req - Express request object with path param: baseProductId and variant data in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with created variant product
 */
export async function createVariantProductAdmin(req, res) {
  try {
    const { baseProductId } = req.params;
    const data = {
      ...req.body,
      baseProduct: baseProductId,
      createdBy: req.user._id,
    };

    const variant = await createVariantProduct(data);
    res.status(201).json(
      formatResponse({
        message: "Variant created successfully",
        data: variant,
      })
    );
  } catch (error) {
    logger.error(
      `[products.controller] Error creating variant: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: "Variant creation failed",
        message: error.message,
      })
    );
  }
}

/**
 * Delete a variant product (admin only)
 * @async
 * @function deleteVariantAdmin
 * @route DELETE /admin/products/:baseProductId/variants/:variantId
 * @access Admin
 * @param {Request} req - Express request object with path params: baseProductId and variantId
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 204 No Content or error response
 */
export async function deleteVariantAdmin(req, res) {
  try {
    const { baseProductId, variantId } = req.params;

    // Fetch variant product to verify it exists and get image publicIds
    const variant = await getProductById(variantId);
    if (!variant) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Variant not found",
        })
      );
    }

    // Verify the variant belongs to the base product
    if (variant.baseProduct?.toString() !== baseProductId) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Variant does not belong to the specified base product",
        })
      );
    }

    // Remove variant reference from base product
    await removeVariantFromProduct(baseProductId, variantId);

    // Delete variant images from Cloudinary
    const publicIds =
      variant.images
        ?.map(img => (typeof img === "string" ? null : img?.publicId))
        .filter(Boolean) || [];
    if (publicIds.length > 0) {
      try {
        await deleteAssets(publicIds);
      } catch (err) {
        logger.warn(
          `[products.controller] Failed to delete some Cloudinary assets for variant ${variantId}: ${err.message}`
        );
      }
    }

    // Delete the variant product
    await deleteProduct(variantId);

    res.status(204).send();
  } catch (error) {
    logger.error(
      `[products.controller] Error deleting variant: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: "Failed to delete variant",
      })
    );
  }
}
