import logger from "../config/logger.js";
import { getUserAnalytics } from "../models/analytics.model.js";

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
