import Order from "./order.mongo.js";
import logger from "../config/logger.js";

export async function getUserAnalytics(userId) {
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

    return {
      displayName: orders[0]?.user.displayName || null,
      email: orders[0]?.user.email || null,
      totalOrders: orders.length,
      totalSpent,
      avgOrderValue: orders.length ? totalSpent / orders.length : 0,
      firstOrderDate: orders[orders.length - 1]?.createdAt || null,
      lastOrderDate: orders[0]?.createdAt || null,
      recentOrders: orders.slice(0, 5).map(o => ({
        id: o._id,
        total: o.total,
        status: o.status,
        date: o.createdAt,
        itemCount: o.items?.length || 0,
      })),
    };
  } catch (error) {
    logger.error(
      `[analytics.model] Error fetching analytics for user ${userId}: ${error.message}`
    );
    throw error;
  }
}
