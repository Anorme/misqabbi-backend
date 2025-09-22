import {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchPublishedProducts,
  countSearchedProducts,
} from "../models/product.model.js";
import logger from "../config/logger.js";

/**
 * @desc    Retrieve all published products for public access
 * @route   GET /products
 * @access  Public
 */
export async function getProducts(req, res) {
  try {
    const filters = {
      name: req.query.name,
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    };

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const totalPublishedProducts = await countSearchedProducts(filters);

    if (page > Math.ceil(totalPublishedProducts / limit)) {
      return res.status(400).json({
        success: false,
        error:
          "Error doing products fetch: requested page exceeds available product pages",
      });
    }

    const products = await searchPublishedProducts(filters, page, limit);

    res.json({
      success: true,
      data: products,
      total: totalPublishedProducts,
      totalPages: Math.ceil(totalPublishedProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error(
      `[products.controller] Error doing products fetch: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ success: false, error: "Error doing products fetch" });
  }
}

/**
 * @desc    Retrieve single product by ID
 * @route   GET /products/:id
 * @access  Public
 */
export async function getProductByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product || !product.isPublished) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Error doing product fetch: product not found",
        });
    }
    res.json(product);
  } catch (error) {
    logger.error(
      `[products.controller] Error doing product fetch for ${req.params.id}: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ success: false, error: "Error doing product fetch" });
  }
}

/**
 * @desc    Create a new product
 * @route   POST /admin/products
 * @access  Admin
 */
export async function createProductHandler(req, res) {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const product = await createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    logger.error(
      `[products.controller] Error doing product creation: ${error.message}`,
      error
    );
    res
      .status(400)
      .json({ success: false, error: "Error doing product creation" });
  }
}

/**
 * @desc    Update an existing product
 * @route   PUT /admin/products/:id
 * @access  Admin
 */
export async function updateProductHandler(req, res) {
  try {
    const { id } = req.params;
    const product = await updateProduct(id, req.body);
    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Error doing product update: product not found",
        });
    }
    res.json(product);
  } catch (error) {
    logger.error(
      `[products.controller] Error doing product update ${req.params.id}: ${error.message}`,
      error
    );
    res
      .status(400)
      .json({ success: false, error: "Error doing product update" });
  }
}

/**
 * @desc    Delete a product by ID
 * @route   DELETE /admin/products/:id
 * @access  Admin
 */
export async function deleteProductHandler(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Error doing product deletion: product not found",
        });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(
      `[products.controller] Error doing product deletion ${req.params.id}: ${error.message}`,
      error
    );
    res
      .status(400)
      .json({ success: false, error: "Error doing product deletion" });
  }
}
