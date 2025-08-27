import Order from "../models/order.mongo.js";
import logger from "../config/logger.js";
import Product from "./product.mongo.js";

export async function createOrderFromCart(user, items, totalPrice, status) {
  try {
    // Check if items array is empty
    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Get IDs of products in the items array
    const itemProductIds = items.map(item => item.product);

    // Fetch published products that match the item IDs
    const publishedProducts = await Product.find({
      // Fetch all products from the database whose _id matches any of the IDs in the cart
      _id: { $in: itemProductIds },
      isPublished: true,
    });

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

    // Create the order
    const order = new Order({ user, items, totalPrice, status });
    await order.save();
    return order;
  } catch (error) {
    logger.warn(error.message);
    throw new Error(error.message);
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

export async function fetchOrderById(orderId, userId) {
  try {
    // Retrieve a specific order by ID, scoped to the logged-in user
    const order = await Order.findOne({ _id: orderId, user: userId });

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

export async function updateOrderStatus(id, status) {
  try {
    const updated = await Order.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );
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
      .limit(limit);
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
