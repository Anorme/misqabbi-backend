import express from "express";

import {
  getProductByIdHandler,
  getProductBySlugHandler,
  getProducts,
} from "../controllers/products.controller.js";

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Fetch all published products with filtering, searching, and sorting
 *     description: Fetch all published products with optional filtering by category, price range, search query, and sorting options
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search query for product name, description, or category
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter products by category
 *       - in: query
 *         name: minPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum: [latest, price-low-high, price-high-low, name-a-z, name-z-a]
 *           default: latest
 *         description: Sort products by specified criteria
 *     responses:
 *       200:
 *         description: A list of published products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Product"
 *                 total:
 *                   type: integer
 *                   description: Total number of published products
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages available
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "product1"
 *                     name: "Product 1"
 *                     description: "Description of Product 1"
 *                     price: 19.99
 *                     published: true
 *                   - id: "product2"
 *                     name: "Product 2"
 *                     description: "Description of Product 2"
 *                     price: 29.99
 *                     published: true
 *                 total: 2
 *                 totalPages: 1
 *                 currentPage: 1
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Invalid sort option. Valid options are: latest, price-low-high, price-high-low, name-a-z, name-z-a"
 *       500:
 *         description: Failed to load products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to load products"
 */
router.get("/", getProducts);

/**
 * @swagger
 * /products/id/{id}:
 *   get:
 *     summary: Fetch a published product by ID
 *     description: Fetch a published product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *               example:
 *                 success: true
 *                 data:
 *                   id: "product1"
 *                   name: "Product 1"
 *                   description: "Description of Product 1"
 *                   price: 19.99
 *                   published: true
 *       500:
 *         description: Failed to load product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to load product"
 */
router.get("/id/:id", getProductByIdHandler);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     summary: Fetch a product by its slug
 *     description: Fetch a product by its slug
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *               example:
 *                 success: true
 *                 data:
 *                   id: "product1"
 *                   name: "Product 1"
 *                   description: "Description of Product 1"
 *                   price: 19.99
 *                   published: true
 *       500:
 *         description: Failed to load product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to load product"
 */
router.get("/:slug", getProductBySlugHandler);

export default router;
