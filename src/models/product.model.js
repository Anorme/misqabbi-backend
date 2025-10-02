import Product from "./product.mongo.js";
import logger from "../config/logger.js";
import { buildProductQuery } from "../utils/productQueryBuilder.js";

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

// Deprecated: use countDiscoverableProducts instead
/**
 * @desc    Count all published products matching given filters
 * @param   {Object} filters - Search filters
 * @param   {String} [filters.q] - Full-text search query (matches name, description, category, brand)
 * @param   {String} [filters.category] - Product category to filter by
 * @param   {Number} [filters.minPrice] - Minimum product price
 * @param   {Number} [filters.maxPrice] - Maximum product price
 * @returns {Promise<Number>} Count of matching published products
 * @throws  {Error} If the count operation fails
 */

async function countSearchedProducts(filters = {}) {
  const query = buildProductQuery(filters);
  return Product.countDocuments(query);
}

/**
 * @desc    Search published products with filters, pagination, and sorting
 * @param   {Object} filters - Search filters
 * @param   {String} [filters.q] - Full-text search query (matches name, description, category, brand)
 * @param   {String} [filters.category] - Product category to filter by
 * @param   {Number} [filters.minPrice] - Minimum product price
 * @param   {Number} [filters.maxPrice] - Maximum product price
 * @param   {Number} [page=1] - Page number for pagination (must be >= 1)
 * @param   {Number} [limit=10] - Number of results per page (must be >= 1)
 * @returns {Promise<Array>} Array of published product documents matching criteria
 * @throws  {Error} If the search operation fails
 */
async function searchPublishedProducts(filters = {}, page = 1, limit = 10) {
  try {
    if (typeof filters !== "object" || Array.isArray(filters)) {
      filters = {};
    }
    const query = buildProductQuery(filters);

    // Safe parsing for page/limit
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);

    // Sorting logic
    const sort = {};
    if (filters.q) {
      sort.score = { $meta: "textScore" };
    } else {
      sort.createdAt = -1;
    }

    // Only project score field if doing text search
    const projection = filters.q ? { score: { $meta: "textScore" } } : {};

    return await Product.find(query, projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
  } catch (error) {
    logger.error(`[products.model] Error searching products: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Count the number of products matching discoverable (search/filter) criteria.
 * @param   {Object} params - Query parameters for filtering/searching products (e.g., q, category, minPrice, maxPrice)
 * @returns {Promise<Number>} Count of products matching the criteria
 */
async function countDiscoverableProducts(params) {
  const { query } = buildProductQuery(params);
  return await Product.countDocuments(query);
}

/**
 * @desc    Retrieve a paginated set of products matching discoverable (search/filter) criteria.
 * @param   {Object} params - Query parameters for filtering/searching products (e.g., q, category, minPrice, maxPrice)
 * @returns {Promise<Array>} Array of products matching the criteria
 */
async function getDiscoverableProducts(params, page = 1, limit = 10) {
  try {
    const { query, projection, sort } = buildProductQuery(params);
    const skip = (page - 1) * limit;

    const products = await Product.find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return products;
  } catch (error) {
    logger.error(
      `[products.model] Error getting discoverable products: ${error.message}`
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
  searchPublishedProducts,
  countSearchedProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
