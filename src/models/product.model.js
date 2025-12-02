import Product from "./product.mongo.js";
import logger from "../config/logger.js";
import { buildProductQuery } from "../utils/buildProductQuery.js";
import slugify from "slugify";

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
      .limit(limit)
      .lean();

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
 * @returns {Promise<Object|null>} Product plain object or null if not found
 */
async function getProductBySlug(slug) {
  try {
    return await Product.findOne({ slug }).lean();
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
    // Generate slug if not provided
    if (!data.slug && data.name) {
      data.slug = slugify(data.name, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

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
 * @desc    Remove swatch image from a product using $unset
 * @param   {String} id - Product ID
 * @returns {Promise<Object|null>} Updated product document or null if not found
 */
async function removeSwatchImage(id) {
  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      { $unset: { swatchImage: "" } },
      { new: true, runValidators: false }
    );
    return updated;
  } catch (error) {
    logger.error(
      `[products.model] Error removing swatch image from product ${id}: ${error.message}`
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

/**
 * @desc    Count the number of all products matching search/filter criteria (admin only - includes unpublished).
 * @param   {Object} params - Query parameters for filtering/searching products (e.g., q, category, minPrice, maxPrice, isPublished)
 * @returns {Promise<Number>} Count of products matching the criteria
 */
async function countAllProducts(params) {
  try {
    const { query } = buildProductQuery({
      ...params,
      includeUnpublished: true,
    });
    return await Product.countDocuments(query);
  } catch (error) {
    logger.error(
      `[products.model] Error counting all products: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieve a paginated set of all products matching search/filter criteria (admin only - includes unpublished).
 * @param   {Object} params - Query parameters for filtering/searching products (e.g., q, category, minPrice, maxPrice, isPublished, sort)
 * @param   {Number} page - Page number (default: 1)
 * @param   {Number} limit - Number of results per page (default: 10)
 * @returns {Promise<Array>} Array of products matching the criteria
 */
async function getPaginatedAllProducts(params, page = 1, limit = 10) {
  try {
    const { query, projection, sort } = buildProductQuery({
      ...params,
      includeUnpublished: true,
    });
    const skip = (page - 1) * limit;

    const products = await Product.find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "variants",
        select:
          "name price images swatchImage variantType stock isPublished createdAt updatedAt",
      });

    return products;
  } catch (error) {
    logger.error(
      `[products.model] Error getting paginated all products: ${error.message}`
    );
    throw error;
  }
}

async function countAllProductsRaw() {
  try {
    return await Product.countDocuments({});
  } catch (error) {
    logger.error(`[products.model] Error counting products: ${error.message}`);
    throw error;
  }
}

async function getLowStockProducts(limit = 5, threshold = 10) {
  try {
    return await Product.find({ stock: { $lt: threshold } })
      .select("name stock slug isPublished")
      .sort({ stock: 1, updatedAt: -1 })
      .limit(limit);
  } catch (error) {
    logger.error(`[products.model] Error fetching low stock: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Validate stock availability using pre-fetched products (synchronous)
 * @param   {Array} items - Array of { product, quantity } or { productId, quantity } objects
 * @param   {Array} products - Pre-fetched product documents
 * @returns {{valid: boolean, errors: Array, products: Array}}
 */
function validateStockAvailabilityWithProducts(items, products) {
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  const errors = [];
  const validItems = [];

  for (const item of items) {
    const productId = (item.productId || item.product).toString();
    const product = productMap.get(productId);
    const quantity = item.quantity;

    if (!product) {
      errors.push(`Product not found: ${productId}`);
      continue;
    }

    if (product.stock < quantity) {
      errors.push(
        `${product.name}: Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
      );
      continue;
    }

    validItems.push({ product, quantity });
  }

  return {
    valid: errors.length === 0,
    errors,
    products: validItems,
  };
}

/**
 * @desc    Validate stock availability for multiple products (fetches from DB)
 * @param   {Array} items - Array of { productId, quantity } or { product, quantity } objects
 * @param   {Object} session - MongoDB session for transaction (optional)
 * @returns {Promise<{valid: boolean, errors: Array, products: Array}>}
 */
async function validateStockAvailability(items, session = null) {
  try {
    const productIds = items.map(item => item.productId || item.product);
    const query = Product.find({ _id: { $in: productIds } });

    if (session) {
      query.session(session);
    }

    const products = await query.select("_id name stock");

    return validateStockAvailabilityWithProducts(items, products);
  } catch (error) {
    logger.error(`[products.model] Error validating stock: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Decrement stock for multiple products atomically (with pre-fetched products)
 * @param   {Array} items - Array of { product, quantity } objects (product must be full document)
 * @param   {Object} session - MongoDB session for transaction (optional)
 * @returns {Promise<Array>} Array of updated product documents
 * @throws  {Error} If update fails or stock goes negative
 */
async function decrementProductStockWithProducts(items, session = null) {
  try {
    // Decrement stock for all products atomically
    const updatePromises = items.map(({ product, quantity }) => {
      const updateQuery = Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -quantity } },
        { new: true, runValidators: true }
      );

      if (session) {
        updateQuery.session(session);
      }

      return updateQuery;
    });

    const updatedProducts = await Promise.all(updatePromises);

    // Safety check: verify no stock went negative
    const negativeStock = updatedProducts.filter(p => p && p.stock < 0);
    if (negativeStock.length > 0) {
      const productNames = negativeStock.map(p => p.name).join(", ");
      logger.error(
        `[products.model] WARNING: Stock went negative for products: ${productNames}`
      );
      throw new Error(
        `Stock decrement resulted in negative values for: ${productNames}`
      );
    }

    logger.info(
      `[products.model] Stock decremented successfully for ${updatedProducts.length} products`
    );

    return updatedProducts;
  } catch (error) {
    logger.error(`[products.model] Error decrementing stock: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Decrement stock for multiple products atomically (fetches from DB)
 * @param   {Array} items - Array of { productId, quantity } or { product, quantity } objects
 * @param   {Object} session - MongoDB session for transaction (optional)
 * @returns {Promise<Array>} Array of updated product documents
 * @throws  {Error} If stock validation fails or update fails
 */
async function decrementProductStock(items, session = null) {
  try {
    // First validate stock availability
    const validation = await validateStockAvailability(items, session);

    if (!validation.valid) {
      throw new Error(
        `Stock validation failed: ${validation.errors.join("; ")}`
      );
    }

    // Decrement stock using the validated products
    return await decrementProductStockWithProducts(
      validation.products,
      session
    );
  } catch (error) {
    logger.error(`[products.model] Error decrementing stock: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Get all variant products for a base product
 * @param   {String} baseProductId - Base product ID
 * @returns {Promise<Array>} Array of variant products (lean objects)
 */
async function getProductVariants(baseProductId) {
  try {
    return await Product.find({
      baseProduct: baseProductId,
      isVariant: true,
    }).lean();
  } catch (error) {
    logger.error(
      `[products.model] Error fetching variants for product ${baseProductId}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Add a variant to a base product's variants array
 * @param   {String} baseProductId - Base product ID
 * @param   {String} variantProductId - Variant product ID
 * @returns {Promise<Object>} Updated base product
 */
async function addVariantToProduct(baseProductId, variantProductId) {
  try {
    return await Product.findByIdAndUpdate(
      baseProductId,
      { $addToSet: { variants: variantProductId } },
      { new: true }
    );
  } catch (error) {
    logger.error(
      `[products.model] Error adding variant ${variantProductId} to product ${baseProductId}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Remove a variant from a base product's variants array
 * @param   {String} baseProductId - Base product ID
 * @param   {String} variantProductId - Variant product ID
 * @returns {Promise<Object>} Updated base product
 */
async function removeVariantFromProduct(baseProductId, variantProductId) {
  try {
    return await Product.findByIdAndUpdate(
      baseProductId,
      { $pull: { variants: variantProductId } },
      { new: true }
    );
  } catch (error) {
    logger.error(
      `[products.model] Error removing variant ${variantProductId} from product ${baseProductId}: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Create a variant product and link it to base product
 * @param   {Object} variantData - Variant product data (must include baseProduct, variantType)
 * @returns {Promise<Object>} Created variant product
 */
async function createVariantProduct(variantData) {
  try {
    // Ensure isVariant is set
    variantData.isVariant = true;

    // Load base product to get slug and validate it exists
    const baseProduct = await getProductById(variantData.baseProduct);
    if (!baseProduct) {
      throw new Error("Base product not found");
    }

    // Generate unique slug for variant (base slug + variant type + timestamp)
    const variantSlug = `${baseProduct.slug}-${variantData.variantType}-${Date.now()}`;
    variantData.slug = slugify(variantSlug, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Create the variant product
    const variant = await Product.create(variantData);

    // Add variant to base product's variants array
    await addVariantToProduct(variantData.baseProduct, variant._id);

    logger.info(
      `[products.model] Created variant product ${variant._id} for base product ${variantData.baseProduct}`
    );

    return variant;
  } catch (error) {
    logger.error(
      `[products.model] Error creating variant product: ${error.message}`
    );
    throw error;
  }
}

/**
 * @desc    Retrieve related products using text search similarity on name within same category,
 *          with fallback to same category products if not enough matches
 * @param   {Object} currentProduct - The current product object (must have _id, name, category)
 * @param   {Number} limit - Maximum number of related products to return (default: 4)
 * @returns {Promise<Array>} Array of related product documents, sorted by relevance
 */
async function getRelatedProducts(currentProduct, limit = 4) {
  try {
    // Validate that we have the required fields
    if (
      !currentProduct ||
      !currentProduct._id ||
      !currentProduct.name ||
      !currentProduct.category
    ) {
      logger.warn(
        `[products.model] Missing required fields for related products: ${currentProduct?._id}`
      );
      return [];
    }

    // Extract keywords from product name (filter short words for better matching)
    const nameKeywords = currentProduct.name
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter short words
      .join(" ");

    // If no keywords after filtering, use the full name
    const searchTerms = nameKeywords || currentProduct.name.toLowerCase();

    let relatedProducts = [];

    // First tier: Try same category + similar name (text search)
    // Only attempt text search if we have search terms
    if (searchTerms) {
      try {
        const primaryQuery = {
          $text: { $search: searchTerms },
          _id: { $ne: currentProduct._id },
          category: currentProduct.category,
          isPublished: true,
          stock: { $gt: 0 },
        };

        relatedProducts = await Product.find(primaryQuery)
          .select("name description price images category stock slug createdAt")
          .limit(limit)
          .sort({ score: { $meta: "textScore" } })
          .lean();
      } catch (textSearchError) {
        // Text search might fail if no matches or index issues
        // Log but continue to fallback
        logger.warn(
          `[products.model] Text search failed for related products: ${textSearchError.message}`
        );
        relatedProducts = [];
      }
    }

    // Second tier: Fallback to same category only if not enough results
    if (relatedProducts.length < limit) {
      const excludeIds = [
        currentProduct._id,
        ...relatedProducts.map(p => p._id),
      ];

      const fallbackQuery = {
        _id: { $nin: excludeIds }, // Exclude current product and already found products
        category: currentProduct.category,
        isPublished: true,
        stock: { $gt: 0 },
      };

      const fallbackProducts = await Product.find(fallbackQuery)
        .select("name description price images category stock slug createdAt")
        .limit(limit - relatedProducts.length)
        .sort({ createdAt: -1 }) // Sort by latest if no text search relevance
        .lean();

      relatedProducts = [...relatedProducts, ...fallbackProducts];
    }

    // Return up to the limit (always return array, even if empty)
    return relatedProducts.slice(0, limit);
  } catch (error) {
    logger.error(
      `[products.model] Error getting related products for ${currentProduct._id}: ${error.message}`
    );
    // Return empty array on error (graceful degradation)
    return [];
  }
}

export {
  getAllProducts,
  getAllPublishedProducts,
  getPaginatedPublishedProducts,
  countPublishedProducts,
  countDiscoverableProducts,
  getDiscoverableProducts,
  countAllProducts,
  getPaginatedAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  countAllProductsRaw,
  getLowStockProducts,
  validateStockAvailability,
  validateStockAvailabilityWithProducts,
  decrementProductStock,
  decrementProductStockWithProducts,
  getRelatedProducts,
  getProductVariants,
  addVariantToProduct,
  removeVariantFromProduct,
  createVariantProduct,
  removeSwatchImage,
};
