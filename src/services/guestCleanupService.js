import logger from "../config/logger.js";
import { deleteStaleGuests } from "../models/user.model.js";

const GUEST_RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function runGuestCleanup() {
  const cutoffDate = new Date(
    Date.now() - GUEST_RETENTION_DAYS * CLEANUP_INTERVAL_MS
  );
  const deletedCount = await deleteStaleGuests(cutoffDate);
  logger.info(
    `[guestCleanupService] Deleted ${deletedCount} stale guest users before ${cutoffDate.toISOString()}`
  );
  return deletedCount;
}

export function scheduleGuestCleanup() {
  const execute = async () => {
    try {
      await runGuestCleanup();
    } catch (error) {
      logger.error(`[guestCleanupService] Cleanup failed: ${error.message}`);
    }
  };

  execute();
  const timer = setInterval(execute, CLEANUP_INTERVAL_MS);
  return timer;
}
