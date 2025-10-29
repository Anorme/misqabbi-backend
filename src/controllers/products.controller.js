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
} from "../models/product.model.js";
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
    const product = await getProductBySlug(slug);
    if (!product || !product.isPublished) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }
    res.status(200).json(formatResponse({ data: product }));
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
    const product = await updateProduct(id, req.body);
    if (!product) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Product not found",
        })
      );
    }
    res.json(
      formatResponse({
        message: "Product updated successfully",
        data: product,
      })
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
