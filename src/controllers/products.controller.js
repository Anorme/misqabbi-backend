import {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getPaginatedPublishedProducts,
  countPublishedProducts,
} from "../models/product.model.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve all published products
 *     description: Retrieve all published products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A list of published products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
/**
 * Fetches a paginated list of published products.
 * @async
 * @function getProducts
 * @param {Request} req - Express request object with optional query params: page, limit
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with product data and pagination info
 */

export async function getProducts(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const totalPublishedProducts = await countPublishedProducts();
    if (page > Math.ceil(totalPublishedProducts / limit)) {
      return res.status(400).json({
        success: false,
        error: "Requested page exceeds available product pages",
      });
    }
    const products = await getPaginatedPublishedProducts(page, limit);
    res.json({
      success: true,
      data: products,
      total: totalPublishedProducts,
      totalPages: Math.ceil(totalPublishedProducts / limit),
      currentPage: page,
    });
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
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Retrieve a published product by ID
 *     description: Retrieve a published product by ID
 *     tags:
 *       - Products
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       200:
 *         description: A published product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       description: Product data to create
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
/**
 * Creates a new product using request body data.
 * @async
 * @function createProductHandler
 * @param {Request} req - Express request object with product data in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with created product or error
 */

export async function createProductHandler(req, res) {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const product = await createProduct(data);
    res.status(201).json(formatResponse({ data: product }));
  } catch (error) {
    logger.error(
      `[products.controller] Error creating product: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: "Invalid product data",
      })
    );
  }
}

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: Update an existing product
 *     tags:
 *       - Products
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     requestBody:
 *       description: Product data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
/**
 * Updates an existing product by ID using request body data.
 * @async
 * @function updateProductHandler
 * @param {Request} req - Express request object with path param: id and update data in body
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends JSON response with updated product or error
 */

export async function updateProductHandler(req, res) {
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
    res.json(formatResponse({ data: product }));
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
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     description: Delete a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *     responses:
 *       204:
 *         description: Product deleted
 */
/**
 * Deletes a product by its ID.
 * @async
 * @function deleteProductHandler
 * @param {Request} req - Express request object with path param: id
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Sends 204 status or error response
 */

export async function deleteProductHandler(req, res) {
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
