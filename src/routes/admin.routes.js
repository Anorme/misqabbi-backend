import express from "express";

import { authenticateToken, checkAdmin } from "../middleware/index.js";
import {
  validateEvent,
  validateEventStatus,
  validateEventTicketType,
  validateFormSchema,
  validateProduct,
  validateVariantProduct,
} from "../middleware/validator.middleware.js";
import {
  attachEventBannerToBody,
  attachVariantImagesToBody,
  attachProductImagesToBody,
} from "../middleware/upload.middleware.js";
import { eventBannerUploads, productUploads } from "../config/cloudinary.js";

import {
  getUserAnalyticsHandler,
  getAdminDashboardHandler,
} from "../controllers/admin.controller.js";
import {
  createDiscountAdmin,
  getDiscountsAdmin,
  getDiscountByIdAdmin,
  updateDiscountAdmin,
  deleteDiscountAdmin,
  generateCodeAdmin,
  getDiscountUsageAdmin,
  getDiscountStatsAdmin,
} from "../controllers/discount.controller.js";
import {
  createEventAdmin,
  addEventTicketTypeAdmin,
  deleteEventTicketTypeAdmin,
  getEventByIdAdmin,
  getEventRegistrationFormAdmin,
  getEventsAdmin,
  updateEventAdmin,
  updateEventTicketTypeAdmin,
  updateEventStatusAdmin,
  upsertEventRegistrationFormAdmin,
} from "../controllers/events.admin.controller.js";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getOrderByIdAdmin,
} from "../controllers/orders.controller.js";
import {
  getUsersAdmin,
  deleteUserByIdAdmin,
  updateUserRoleAdmin,
} from "../controllers/users.controller.js";
import {
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getProductsAdmin,
  getProductVariantsAdmin,
  createVariantProductAdmin,
  deleteVariantAdmin,
  updateProductSwatchImageAdmin,
  updateVariantSwatchImageAdmin,
  deleteProductImageAdmin,
  deleteVariantImageAdmin,
  deleteProductSwatchImageAdmin,
  deleteVariantSwatchImageAdmin,
} from "../controllers/products.controller.js";

const router = express.Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard KPIs (admin only)
 *     description: Retrieve key performance indicators for the admin dashboard. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recent orders to display
 *       - in: query
 *         name: threshold
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Low stock threshold for products
 *       - in: query
 *         name: months
 *         required: false
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to aggregate revenue by
 *     responses:
 *       200:
 *         description: Admin dashboard KPIs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totals:
 *                       type: object
 *                       properties:
 *                         products:
 *                           type: integer
 *                         orders:
 *                           type: integer
 *                         users:
 *                           type: integer
 *                         revenueByMonth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               year:
 *                                 type: integer
 *                               month:
 *                                 type: integer
 *                               total:
 *                                 type: number
 *       500:
 *         description: Failed to load dashboard
 */
router.get(
  "/dashboard",
  authenticateToken,
  checkAdmin,
  getAdminDashboardHandler
);

router.post(
  "/events",
  authenticateToken,
  checkAdmin,
  eventBannerUploads.fields([{ name: "banner", maxCount: 1 }]),
  attachEventBannerToBody,
  validateEvent,
  createEventAdmin
);

router.get("/events", authenticateToken, checkAdmin, getEventsAdmin);

router.get("/events/:id", authenticateToken, checkAdmin, getEventByIdAdmin);

router.patch(
  "/events/:id",
  authenticateToken,
  checkAdmin,
  eventBannerUploads.fields([{ name: "banner", maxCount: 1 }]),
  attachEventBannerToBody,
  validateEvent,
  updateEventAdmin
);

router.patch(
  "/events/:id/status",
  authenticateToken,
  checkAdmin,
  validateEventStatus,
  updateEventStatusAdmin
);

router.put(
  "/events/:id/registration-form",
  authenticateToken,
  checkAdmin,
  validateFormSchema,
  upsertEventRegistrationFormAdmin
);

router.get(
  "/events/:id/registration-form",
  authenticateToken,
  checkAdmin,
  getEventRegistrationFormAdmin
);

router.post(
  "/events/:id/ticket-types",
  authenticateToken,
  checkAdmin,
  validateEventTicketType,
  addEventTicketTypeAdmin
);

router.patch(
  "/events/:id/ticket-types/:ticketTypeId",
  authenticateToken,
  checkAdmin,
  validateEventTicketType,
  updateEventTicketTypeAdmin
);

router.delete(
  "/events/:id/ticket-types/:ticketTypeId",
  authenticateToken,
  checkAdmin,
  deleteEventTicketTypeAdmin
);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     description: Retrieve all orders in the system. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       400:
 *         description: Requested page exceeds available order pages
 *       500:
 *         description: Failed to load orders
 */

router.get("/orders", authenticateToken, checkAdmin, getAllOrdersAdmin);

/**
 * @swagger
 * /admin/orders/id/{orderId}:
 *   get:
 *     summary: Get a specific order by ID (admin only)
 *     description: Retrieve a specific order by its ID. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order id supplied
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to load order
 */
router.get(
  "/orders/id/:orderId",
  authenticateToken,
  checkAdmin,
  getOrderByIdAdmin
);

/**
 * @swagger
 * /admin/orders/{id}:
 *   patch:
 *     summary: Update the status of an order (admin only)
 *     description: Update the status of a specific order by its ID. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the order (e.g., 'pending', 'shipped', 'delivered', 'cancelled')
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order id or invalid request body
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to update order status
 */

router.patch(
  "/orders/:id",
  authenticateToken,
  checkAdmin,
  updateOrderStatusAdmin
);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     description: Retrieve a paginated list of all published orders. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: [additional filters]
 *         schema:
 *           type: string
 *         description: Optional query filters for orders (implementation-dependent)
 *     responses:
 *       200:
 *         description: A paginated list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       400:
 *         description: Bad request, typically when page exceeds available order pages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (not an admin user)
 *       500:
 *         description: Server error
 */

router.get(
  "/orders/id/:orderId",
  authenticateToken,
  checkAdmin,
  getOrderByIdAdmin
);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products including unpublished (admin only)
 *     description: Retrieve a paginated list of all products with support for filtering, searching, and sorting. Includes both published and unpublished products.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
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
 *         name: isPublished
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filter by publish status. Use "true" for published only, "false" for unpublished only, "all" for all products (default)
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
 *         description: A list of products (published and unpublished)
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
 *                   description: Total number of products matching filters
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages available
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Failed to load products
 */
router.get("/products", authenticateToken, checkAdmin, getProductsAdmin);

/**
 * @swagger
 * /admin/analytics/{userId}:
 *   get:
 *     summary: Get analytics for a specific user (admin only)
 *     description: Retrieve analytics data for a user specified by userId. Only accessible to admins.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to get analytics for
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Analytics data for the specified user
 *       400:
 *         description: Invalid user id supplied
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to retrieve user analytics
 */

router.get(
  "/analytics/:userId",
  authenticateToken,
  checkAdmin,
  getUserAnalyticsHandler
);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a new product (admin only)
 *     description: Create a new product with support for uploading up to 5 images. The images must be sent as multipart/form-data along with the product data fields.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Product data to create, with image uploads. Use 'multipart/form-data' with separate fields for swatchImage (optional) and gallery images.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The product name.
 *               description:
 *                 type: string
 *                 description: The product description.
 *               price:
 *                 type: number
 *                 description: The product price.
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: Swatch image for color/print picker (optional, single file)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images for the product (optional, max 5 files).
 *                 maxItems: 5
 *               category:
 *                 type: string
 *                 description: The product category.
 *               stock:
 *                 type: integer
 *                 description: Product stock quantity.
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Invalid product data
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
 *                   example: "Invalid product data"
 */
router.post(
  "/products",
  authenticateToken,
  checkAdmin,
  productUploads.fields([
    { name: "swatchImage", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  attachProductImagesToBody,
  validateProduct,
  createProductAdmin
);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update an existing product (admin only)
 *     description: Update an existing product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Product data to update. Use 'multipart/form-data' for image uploads, or 'application/json' for text-only updates.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: Swatch image for color/print picker (optional, single file)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images (optional, max 5 files)
 *                 maxItems: 5
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
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
 *               swatchImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   publicId:
 *                     type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Product update failed
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
 *                   example: "Product update failed"
 */
router.put(
  "/products/:id",
  authenticateToken,
  checkAdmin,
  productUploads.fields([
    { name: "swatchImage", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  attachProductImagesToBody,
  validateProduct,
  updateProductAdmin
);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a product by ID (admin only)
 *     description: Delete a product by ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       400:
 *         description: Product deletion failed
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
 *                   example: "Product deletion failed"
 */
router.delete(
  "/products/:id",
  authenticateToken,
  checkAdmin,
  deleteProductAdmin
);

/**
 * @swagger
 * /admin/products/{id}/variants:
 *   get:
 *     summary: Get all variants for a product (admin only)
 *     description: Retrieve all variant products associated with a base product
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *     responses:
 *       200:
 *         description: List of variant products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Product"
 *       500:
 *         description: Server error
 */
router.get(
  "/products/:id/variants",
  authenticateToken,
  checkAdmin,
  getProductVariantsAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants:
 *   post:
 *     summary: Create a new variant product (admin only)
 *     description: Create a variant product (color or print) for a base product. Supports uploading up to 5 images.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *     requestBody:
 *       description: Variant product data with image uploads. Use 'multipart/form-data' with separate fields for swatchImage and gallery images.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - variantType
 *               - name
 *               - price
 *               - category
 *               - stock
 *               - swatchImage
 *             properties:
 *               name:
 *                 type: string
 *                 description: The variant product name (typically same as base product)
 *               description:
 *                 type: string
 *                 description: The variant product description
 *               price:
 *                 type: number
 *                 description: The variant product price
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: Swatch image for color/print picker (required, single file)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images for the variant (optional, max 5 files)
 *                 maxItems: 5
 *               category:
 *                 type: string
 *                 description: The variant product category
 *               stock:
 *                 type: integer
 *                 description: Variant product stock quantity
 *               variantType:
 *                 type: string
 *                 enum: [color, print]
 *                 description: Type of variant (color or print)
 *               isPublished:
 *                 type: boolean
 *                 description: Whether the variant is published
 *     responses:
 *       201:
 *         description: Variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Invalid variant data
 */
router.post(
  "/products/:baseProductId/variants",
  authenticateToken,
  checkAdmin,
  productUploads.fields([
    { name: "swatchImage", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  attachVariantImagesToBody,
  validateVariantProduct,
  createVariantProductAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants/{variantId}:
 *   delete:
 *     summary: Delete a variant product (admin only)
 *     description: Delete a variant product and remove it from the base product's variants array. Also deletes associated images from Cloudinary.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant product ID to delete
 *     responses:
 *       204:
 *         description: Variant deleted successfully
 *       404:
 *         description: Variant not found
 *       400:
 *         description: Bad request (e.g., variant doesn't belong to base product)
 */
router.delete(
  "/products/:baseProductId/variants/:variantId",
  authenticateToken,
  checkAdmin,
  deleteVariantAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants/{variantId}/swatch-image:
 *   put:
 *     summary: Update swatch image for a variant (admin only)
 *     description: Update the swatch image (color/print picker image) for a variant product. Replaces the existing swatch image.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant product ID
 *     requestBody:
 *       description: New swatch image file. Use 'multipart/form-data' with field name 'swatchImage'.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - swatchImage
 *             properties:
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: New swatch image file (single file)
 *     responses:
 *       200:
 *         description: Swatch image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (missing swatch image or variant doesn't belong to base)
 *       404:
 *         description: Variant not found
 */
/**
 * @swagger
 * /admin/products/{id}/swatch-image:
 *   put:
 *     summary: Update swatch image for a base product (admin only)
 *     description: Update the swatch image for a base product. The swatch image is used for color/print picker display.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - swatchImage
 *             properties:
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: Swatch image file (single file)
 *     responses:
 *       200:
 *         description: Swatch image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Swatch image updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (missing swatch image or product is a variant)
 *       404:
 *         description: Product not found
 */
router.put(
  "/products/:id/swatch-image",
  authenticateToken,
  checkAdmin,
  productUploads.fields([{ name: "swatchImage", maxCount: 1 }]),
  updateProductSwatchImageAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants/{variantId}/swatch-image:
 *   put:
 *     summary: Update swatch image for a variant (admin only)
 *     description: Update the swatch image for a product variant. The swatch image is used for color/print picker display.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - swatchImage
 *             properties:
 *               swatchImage:
 *                 type: string
 *                 format: binary
 *                 description: Swatch image file (single file)
 *     responses:
 *       200:
 *         description: Swatch image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Swatch image updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (missing swatch image or variant doesn't belong to base)
 *       404:
 *         description: Variant not found
 */
router.put(
  "/products/:baseProductId/variants/:variantId/swatch-image",
  authenticateToken,
  checkAdmin,
  productUploads.fields([{ name: "swatchImage", maxCount: 1 }]),
  updateVariantSwatchImageAdmin
);

/**
 * @swagger
 * /admin/products/{id}/images/{publicId}:
 *   delete:
 *     summary: Delete a single gallery image from a product (admin only)
 *     description: Delete a specific gallery image from a base product by its publicId. The image will be removed from both the database and Cloudinary.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary publicId of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image deleted successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (product is a variant or deletion failed)
 *       404:
 *         description: Product or image not found
 */
router.delete(
  "/products/:id/images/:publicId",
  authenticateToken,
  checkAdmin,
  deleteProductImageAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants/{variantId}/images/{publicId}:
 *   delete:
 *     summary: Delete a single gallery image from a variant (admin only)
 *     description: Delete a specific gallery image from a variant product by its publicId. The image will be removed from both the database and Cloudinary.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant product ID
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary publicId of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image deleted successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (variant doesn't belong to base product or deletion failed)
 *       404:
 *         description: Variant or image not found
 */
router.delete(
  "/products/:baseProductId/variants/:variantId/images/:publicId",
  authenticateToken,
  checkAdmin,
  deleteVariantImageAdmin
);

/**
 * @swagger
 * /admin/products/{id}/swatch-image:
 *   delete:
 *     summary: Delete swatch image from a base product (admin only)
 *     description: Delete the swatch image from a base product. The image will be removed from both the database and Cloudinary.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Swatch image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Swatch image deleted successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (product is a variant or deletion failed)
 *       404:
 *         description: Product or swatch image not found
 */
router.delete(
  "/products/:id/swatch-image",
  authenticateToken,
  checkAdmin,
  deleteProductSwatchImageAdmin
);

/**
 * @swagger
 * /admin/products/{baseProductId}/variants/{variantId}/swatch-image:
 *   delete:
 *     summary: Delete swatch image from a variant (admin only)
 *     description: Delete the swatch image from a variant product. The image will be removed from both the database and Cloudinary.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: baseProductId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant product ID
 *     responses:
 *       200:
 *         description: Swatch image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Swatch image deleted successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Bad request (variant doesn't belong to base product or deletion failed)
 *       404:
 *         description: Variant or swatch image not found
 */
router.delete(
  "/products/:baseProductId/variants/:variantId/swatch-image",
  authenticateToken,
  checkAdmin,
  deleteVariantSwatchImageAdmin
);

// Admin: list users
router.get("/users", authenticateToken, checkAdmin, getUsersAdmin);

// Admin: delete user by id
router.delete("/users/:id", authenticateToken, checkAdmin, deleteUserByIdAdmin);

// Admin: update user role
router.patch(
  "/users/:id/role",
  authenticateToken,
  checkAdmin,
  updateUserRoleAdmin
);

// ============================================
// Discount Management Routes
// ============================================

/**
 * @swagger
 * /admin/discounts/stats:
 *   get:
 *     summary: Get discount statistics (admin only)
 *     description: Retrieve statistics about discount codes for the admin dashboard.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Discount statistics retrieved successfully
 */
router.get(
  "/discounts/stats",
  authenticateToken,
  checkAdmin,
  getDiscountStatsAdmin
);

/**
 * @swagger
 * /admin/discounts/generate-code:
 *   post:
 *     summary: Generate a random discount code (admin only)
 *     description: Generate a unique random discount code without creating a discount.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prefix:
 *                 type: string
 *                 description: Custom prefix for the code (default MISQ)
 *               segmentLength:
 *                 type: integer
 *                 description: Length of each segment (default 4)
 *               segmentCount:
 *                 type: integer
 *                 description: Number of segments (default 2)
 *     responses:
 *       200:
 *         description: Code generated successfully
 */
router.post(
  "/discounts/generate-code",
  authenticateToken,
  checkAdmin,
  generateCodeAdmin
);

/**
 * @swagger
 * /admin/discounts:
 *   get:
 *     summary: Get all discount codes (admin only)
 *     description: Retrieve a paginated list of all discount codes with optional filters.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [order, products]
 *       - in: query
 *         name: usageType
 *         schema:
 *           type: string
 *           enum: [single_use, multi_use, per_user]
 *       - in: query
 *         name: expired
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of discounts
 */
router.get("/discounts", authenticateToken, checkAdmin, getDiscountsAdmin);

/**
 * @swagger
 * /admin/discounts:
 *   post:
 *     summary: Create a new discount code (admin only)
 *     description: Create a new discount code with specified configuration.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - discountType
 *               - discountValue
 *               - expiryDate
 *             properties:
 *               code:
 *                 type: string
 *                 description: Custom code (auto-generated if not provided)
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *                 description: Cap for percentage discounts
 *               scope:
 *                 type: string
 *                 enum: [order, products]
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *               applicableCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               usageType:
 *                 type: string
 *                 enum: [single_use, multi_use, per_user]
 *               maxGlobalUses:
 *                 type: integer
 *               maxUsesPerUser:
 *                 type: integer
 *               minOrderValue:
 *                 type: number
 *               minItemCount:
 *                 type: integer
 *               firstOrderOnly:
 *                 type: boolean
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/discounts", authenticateToken, checkAdmin, createDiscountAdmin);

/**
 * @swagger
 * /admin/discounts/{id}:
 *   get:
 *     summary: Get a discount by ID (admin only)
 *     description: Retrieve a single discount code with usage statistics.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount details
 *       404:
 *         description: Discount not found
 */
router.get(
  "/discounts/:id",
  authenticateToken,
  checkAdmin,
  getDiscountByIdAdmin
);

/**
 * @swagger
 * /admin/discounts/{id}:
 *   put:
 *     summary: Update a discount (admin only)
 *     description: Update an existing discount code. The code itself cannot be changed.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               discountValue:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               maxGlobalUses:
 *                 type: integer
 *               minOrderValue:
 *                 type: number
 *               minItemCount:
 *                 type: integer
 *               firstOrderOnly:
 *                 type: boolean
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       404:
 *         description: Discount not found
 */
router.put(
  "/discounts/:id",
  authenticateToken,
  checkAdmin,
  updateDiscountAdmin
);

/**
 * @swagger
 * /admin/discounts/{id}:
 *   delete:
 *     summary: Deactivate a discount (admin only)
 *     description: Soft delete a discount by setting isActive to false.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount deactivated successfully
 *       404:
 *         description: Discount not found
 */
router.delete(
  "/discounts/:id",
  authenticateToken,
  checkAdmin,
  deleteDiscountAdmin
);

/**
 * @swagger
 * /admin/discounts/{id}/usage:
 *   get:
 *     summary: Get usage history for a discount (admin only)
 *     description: Retrieve paginated usage history for a specific discount code.
 *     tags:
 *       - Admin - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Usage history
 *       404:
 *         description: Discount not found
 */
router.get(
  "/discounts/:id/usage",
  authenticateToken,
  checkAdmin,
  getDiscountUsageAdmin
);

export default router;
