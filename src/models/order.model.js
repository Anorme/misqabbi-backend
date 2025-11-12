import Order from "../models/order.mongo.js";
import logger from "../config/logger.js";
import Product from "./product.mongo.js";
import {
  validateStockAvailabilityWithProducts,
  decrementProductStockWithProducts,
} from "./product.model.js";
import mongoose from "mongoose";

export async function createOrderFromCart(
  user,
  items,
  shippingInfo,
  totalPrice,
  status
) {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if items array is empty
    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Get IDs of products in the items array
    const itemProductIds = items.map(item => item.product);

    // Fetch published products that match the item IDs WITH STOCK INFO
    // Use session to ensure we're reading within the transaction
    const publishedProducts = await Product.find({
      _id: { $in: itemProductIds },
      isPublished: true,
    })
      .session(session)
      .select("_id name stock");

    // Convert publishedProducts ids to strings and store in the publishedProductIds set
    const publishedProductIds = new Set(
      publishedProducts.map(product => product._id.toString())
    );

    // Check if every item's productId is present in the publishedProductIds set
    const allItemsArePublished = items.every(item =>
      publishedProductIds.has(item.product.toString())
    );

    if (!allItemsArePublished) {
      throw new Error("Some products are not available or unpublished");
    }

    // EARLY STOCK VALIDATION
    const stockValidation = validateStockAvailabilityWithProducts(
      items,
      publishedProducts
    );

    if (!stockValidation.valid) {
      throw new Error(
        `Stock validation failed: ${stockValidation.errors.join("; ")}`
      );
    }

    // Decrement stock
    await decrementProductStockWithProducts(stockValidation.products, session);

    // Create the order within the transaction
    const order = new Order({ user, items, shippingInfo, totalPrice, status });
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    logger.info(
      `[order.model] Order created successfully: ${order._id}, Stock decremented for ${items.length} products`
    );

    return order;
  } catch (error) {
    // Rollback the transaction on error
    await session.abortTransaction();
    logger.error(
      `[order.model] Error creating order: ${error.message}. Transaction rolled back.`
    );
    throw new Error(error.message);
  } finally {
    // End the session
    session.endSession();
  }
}

export async function getOrdersByUser(userId) {
  // Retrieve all orders belonging to the authenticated user

  try {
    const orders = await Order.find({ user: userId });
    return orders;
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
  }
}

export async function getPaginatedOrdersByUser(userId, page, limit) {
  try {
    const skip = (page - 1) * limit;

    return await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "items.product", select: "name slug images price" });
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
  }
}

export async function countOrdersByUser(userId) {
  try {
    return await Order.countDocuments({ user: userId });
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
  }
}

export async function fetchOrderById(orderId, userId) {
  try {
    // Retrieve a specific order by ID, scoped to the logged-in user
    const order = await Order.findOne({ _id: orderId, user: userId }).populate({
      path: "items.product",
      select: "name slug images price",
    });

    // If no order is found or user doesn't own it
    if (!order) {
      throw new Error("Order not found or access denied");
    }
    return order;
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
  }
}

export async function fetchOrderByIdAdmin(orderId) {
  try {
    const order = await Order.findOne({ _id: orderId })
      .populate({ path: "items.product", select: "name slug images price" })
      .populate({ path: "user", select: "name email" });
    return order;
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
  }
}

/**
 * Fetch order by ID to get current status (for status change detection)
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order with status field
 */
export async function fetchOrderStatus(orderId) {
  try {
    const order = await Order.findById(orderId).select("status");
    return order;
  } catch (error) {
    logger.warn(`[order.model] Error fetching order status: ${error.message}`);
    throw new Error(error.message);
  }
}

export async function updateOrderStatus(id, status) {
  try {
    const updated = await Order.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({ path: "items.product", select: "name slug images price" })
      .populate({ path: "user", select: "name email" });
    return updated;
  } catch (error) {
    logger.error(
      `[order.model] Error updating product ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function getPaginatedPublishedOrders(page, limit, query) {
  try {
    const startIndex = (page - 1) * limit;
    const filterOptions = {};

    // Status filter
    if (query.status && query.status !== "all") {
      filterOptions.status = query.status;
    }

    // Date range filter
    if (query.startDate && query.endDate) {
      filterOptions.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    return await Order.find(filterOptions)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate({ path: "items.product", select: "name slug images price" })
      .populate({ path: "user", select: "name email" });
  } catch (error) {
    logger.error(
      `[orders.model] Error fetching paginated orders: ${error.message}`
    );
    throw error;
  }
}

export async function countPublishedOrders() {
  try {
    return await Order.countDocuments();
  } catch (error) {
    logger.error(
      `[orders.model] Error counting published orders: ${error.message}`
    );
    throw error;
  }
}

export async function countAllOrders() {
  try {
    return await Order.countDocuments();
  } catch (error) {
    logger.error(`[orders.model] Error counting orders: ${error.message}`);
    throw error;
  }
}

export async function getRecentOrders(limit = 5) {
  try {
    return await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "items.product", select: "name slug images price" })
      .populate({ path: "user", select: "name email" });
  } catch (error) {
    logger.error(
      `[orders.model] Error fetching recent orders: ${error.message}`
    );
    throw error;
  }
}

export async function aggregateRevenueByMonth(limitMonths = 12) {
  try {
    const now = new Date();
    const from = new Date(
      now.getFullYear(),
      now.getMonth() - (limitMonths - 1),
      1
    );
    const pipeline = [
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          total: 1,
        },
      },
    ];
    return await Order.aggregate(pipeline);
  } catch (error) {
    logger.error(`[orders.model] Error aggregating revenue: ${error.message}`);
    throw error;
  }
}

// Total revenue over the last N days (default: previous 30 days)
export async function aggregateRevenueLastNDays(days = 30) {
  try {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));

    const res = await Order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      { $project: { _id: 0, total: 1 } },
    ]);
    return res[0]?.total || 0;
  } catch (error) {
    logger.error(
      `[orders.model] Error aggregating 30-day revenue: ${error.message}`
    );
    throw error;
  }
}
