import {
  getAllPublishedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/product.model.js";
import logger from "../config/logger.js";

/**
 * @desc    Retrieve all published products for public access
 * @route   GET /products
 * @access  Public
 */
export async function getProducts(req, res) {
  try {
    const products = await getAllPublishedProducts();
    res.json(products);
  } catch (error) {
    logger.error(
      `[products.controller] Failed to fetch products: ${error.message}`
    );
    res.status(500).json({ error: "Failed to load products" });
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
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    logger.error(
      `[products.controller] Error getting product ${req.params.id}: ${error.message}`
    );
    res.status(500).json({ error: "Failed to load product " });
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
      `[products.controller] Error creating product: ${error.message}`
    );
    res.status(400).json({ error: "Invalid product data" });
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
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    logger.error(
      `[products.controller] Product update failed: ${error.message}`
    );
    res.status(400).json({ error: "Product update failed" });
  }
}

/**
 *
 * @desc    Delete a product by ID
 * @route   DELETE/admin/products/:id
 * @access  Admin
 */
export async function deleteProductHandler(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(
      `[products.controller] Product deletion failed: ${error.message}`
    );
    res.status(400).json({ error: "Product deletion failed" });
  }
}
