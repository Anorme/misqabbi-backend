import logger from "../config/logger.js";
import { getUserAnalytics } from "../models/analytics.model.js";
import {
  countAllOrders,
  getRecentOrders,
  aggregateRevenueByMonth,
} from "../models/order.model.js";
import {
  countAllProductsRaw,
  getLowStockProducts,
} from "../models/product.model.js";
import { countAllUsers } from "../models/user.model.js";

export async function getUserAnalyticsHandler(req, res) {
  try {
    const { userId } = req.params;
    const analytics = await getUserAnalytics(userId);
    if (!analytics) {
      return res.status(404).json({ error: "No analytics found for user" });
    }
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error(
      `[admin.controller] Failed to fetch user analytics: ${error.message}`
    );
    res.status(500).json({ error: "Failed to load user analytics" });
  }
}

export async function getAdminDashboardHandler(req, res) {
  try {
    const limit = Math.max(parseInt(req.query.limit) || 5, 1);
    const threshold = Math.max(parseInt(req.query.threshold) || 10, 0);
    const months = Math.max(parseInt(req.query.months) || 12, 1);

    const [products, orders, users, recentOrders, lowStock, revenueByMonth] =
      await Promise.all([
        countAllProductsRaw(),
        countAllOrders(),
        countAllUsers(),
        getRecentOrders(limit),
        getLowStockProducts(limit, threshold),
        aggregateRevenueByMonth(months),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totals: { products, orders, users, revenueByMonth },
        recentOrders,
        lowStock,
      },
    });
  } catch (error) {
    logger.error(
      `[admin.controller] Failed to load dashboard: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, error: "Failed to load dashboard" });
  }
}
