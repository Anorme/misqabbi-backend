import {
  countPublishedOrders,
  getPaginatedPublishedOrders,
  updateOrderStatus,
} from "../models/order.model.js";
import logger from "../config/logger.js";

export async function getAllOrders(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const totalPublishedOrders = await countPublishedOrders();
    if (page > Math.ceil(totalPublishedOrders / limit)) {
      return res.status(400).json({
        success: false,
        error: "Requested page exceeds available order pages",
      });
    }
    const orders = await getPaginatedPublishedOrders(page, limit, req.query);
    res.json({
      success: true,
      data: orders,
      total: totalPublishedOrders,
      totalPages: Math.ceil(totalPublishedOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error(
      `[orders.controller] Failed to fetch orders: ${error.message}`
    );
    res.status(500).json({ error: "Failed to load orders" });
  }
}

/**
 * @desc    Update an existing order's status
 * @route   PUT /admin/orders/:id
 * @access  Admin
 */
export async function updateOrderStatusHandler(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await updateOrderStatus(id, status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    logger.error(
      `[order.controller] Order status update failed: ${error.message}`
    );
    res.status(400).json({ error: "Order status update failed" });
  }
}
