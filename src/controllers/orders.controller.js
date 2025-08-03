import Product from "../models/products.mongo.js"; // ensure this is imported
import Order from "../models/order.mongo.js";
import logger from "../config/logger.js";

export const createOrder = async (req, res) => {
  const { user, items, totalPrice, status } = req.body;

  try {
    // Check if items array is empty
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get IDs of products in the items array
    const itemProductIds = items.map(item => item.productId);

    // Fetch published products that match the item IDs
    const publishedProducts = await Product.find({
      // Fetch all products from the database whose _id matches any of the IDs in the cart
      _id: { $in: itemProductIds },
      isPublished: true,
    });

    // If any product is not found or unpublished
    if (publishedProducts.length !== items.length) {
      return res
        .status(400)
        .json({ error: "Some products are not available or unpublished" });
    }

    // Create the order
    const order = new Order({ user, items, totalPrice, status });
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

//get all orders
export const getOrders = async (req, res) => {
  const userId = req.user._id;

  // Retrieve all orders belonging to the authenticated user
  try {
    const orders = await Order.find({ userId });
    res.status(200).json({ orders });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ message: "Failed to retrieve orders" });
  }
};

//get order by id
export const getOrderById = async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  // Retrieve a specific order by ID, scoped to the logged-in user
  try {
    const order = await Order.findOne({ _id: orderId, userId });

    // If no order is found or user doesn't own it
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or access denied" });
    }

    res.status(200).json({ order });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ message: "Failed to retrieve order" });
  }
};
