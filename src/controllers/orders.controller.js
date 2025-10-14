import {
  createOrderFromCart,
  getPaginatedOrdersByUser,
  countOrdersByUser,
  fetchOrderById,
} from "../models/order.model.js";
import logger from "../config/logger.js";

export const createOrder = async (req, res) => {
  const { user, items, totalPrice } = req.body;
  try {
    const order = await createOrderFromCart(
      user,
      items,
      totalPrice,
      "accepted"
    );
    res.status(201).json({ order });
  } catch (error) {
    logger.warn(error);
    res
      .status(500)
      .json({ error: "Order creation failed due to server error" });
  }
};

//get all orders
export const getOrders = async (req, res) => {
  const userId = req.user._id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  try {
    const [orders, total] = await Promise.all([
      getPaginatedOrdersByUser(userId, page, limit),
      countOrdersByUser(userId),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
};

//get order by id
export const getOrderById = async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  try {
    const order = await fetchOrderById(orderId, userId);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Failed to retrieve order" });
  }
};
