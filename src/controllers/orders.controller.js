import {
  createOrderFromCart,
  getOrdersByUser,
  fetchOrderById,
} from "../models/order.model.js";
import logger from "../config/logger.js";

export const createOrder = async (req, res) => {
  const { user, items, totalPrice } = req.body;
  try {
    const order = await createOrderFromCart(user, items, totalPrice, "pending");
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
  try {
    const orders = await getOrdersByUser(userId);
    res.status(200).json({ orders });
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
    res.status(200).json({ order });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Failed to retrieve order" });
  }
};
