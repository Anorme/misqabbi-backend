import Product from "./product.mongo.js";
import logger from "../config/logger.js";

/**
 * @desc    Retrieve all products from the database (regardless of publish status)
 * @returns {Promise<Array>}  Array of product documents
 */
async function getAllProducts() {
  try {
    const products = await Product.find({});
    return products;
  } catch (error) {
    logger.error(`[products.model] Error fetching products: ${error}`);
    throw error;
  }
}

/**
 * @desc      Retrieve all products where isPublished is true
 * @returns   {Promise<Array>} Array of published product documents
 */
async function getAllPublishedProducts() {
  try {
    return await Product.find({ isPublished: true });
  } catch (error) {
    logger.error(
      `[products.model] Error fetching published products: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieve the count of all products where isPublished is true
 * @returns {Promise<Number>} Count of published product documents
 */
async function countPublishedProducts() {
  try {
    return await Product.countDocuments({ isPublished: true });
  } catch (error) {
    logger.error(
      `[products.model] Error counting published products: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieve a paginated set of published products
 * @param   {Number} page - Page number of results to return
 * @param   {Number} limit - Number of results per page
 * @returns {Promise<Array>} Array of published product documents
 * @throws  {Error} When there is an error fetching the paginated products
 */
async function getPaginatedPublishedProducts(page, limit) {
  try {
    const startIndex = (page - 1) * limit;

    return await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
  } catch (error) {
    logger.error(
      `[products.model] Error fetching paginated products: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieve a single product by its MongoDB _id
 * @param   {String} id - Product ID
 * @returns {Promise<Object|null>} Product document or null if not found
 */
async function getProductById(id) {
  try {
    return await Product.findById(id);
  } catch (error) {
    logger.error(
      `[products.model] Error finding product by id ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieves a single product by its slug.
 * @param   {String} slug - Product slug
 * @returns {Promise<Object|null>} Product document or null if not found
 */
async function getProductBySlug(slug) {
  try {
    return await Product.findOne({ slug });
  } catch (error) {
    logger.error(
      `[product.model] Error finding product by slug ${slug}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Create a new product document in the database
 * @param   {Object} data - Product data (matches schema shape)
 * @returns {Promise<Object>} Created product document
 */
async function createProduct(data) {
  try {
    const product = await Product.create(data);
    return product;
  } catch (error) {
    logger.error(`[products.model] Error creating product: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Update a product document by ID
 * @param   {String} id - Product ID
 * @param   {Object} updates - Updated fields
 * @returns {Promise<Object|null>} Updated product or null if not found
 */
async function updateProduct(id, updates) {
  try {
    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    return updated;
  } catch (error) {
    logger.error(
      `[products.model] Error updating product ${id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Delete a product by its ID
 * @param   {String} id - Product ID
 * @returns {Promise<Object|null>} Deleted document or null if not found
 */
async function deleteProduct(id) {
  try {
    const result = await Product.findByIdAndDelete(id);
    return result;
  } catch (error) {
    logger.error(
      `[products.model] Error deleting product ${id}: ${error.message}`
    );
    throw error;
  }
}

export {
  getAllProducts,
  getAllPublishedProducts,
  getPaginatedPublishedProducts,
  countPublishedProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
