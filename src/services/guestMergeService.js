import mongoose from "mongoose";
import User from "../models/user.mongo.js";
import { reassignOrdersToUser } from "../models/order.model.js";
import { reassignTransactionsToUser } from "../models/transaction.model.js";
import { reassignDiscountUsageToUser } from "../models/discountUsage.model.js";
import logger from "../config/logger.js";

export async function mergeGuestIntoUser(guestUserId, realUserId) {
  if (!guestUserId || !realUserId) {
    return { merged: false, reason: "missing_ids" };
  }

  if (guestUserId.toString() === realUserId.toString()) {
    return { merged: false, reason: "same_identity" };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [guestUser, realUser] = await Promise.all([
      User.findById(guestUserId).session(session),
      User.findById(realUserId).session(session),
    ]);

    if (!realUser) {
      await session.abortTransaction();
      return { merged: false, reason: "real_user_not_found" };
    }

    if (!guestUser || !guestUser.isGuest) {
      await session.abortTransaction();
      return { merged: false, reason: "guest_not_found" };
    }

    if (guestUser.guestMergedInto) {
      await session.abortTransaction();
      return { merged: false, reason: "already_merged" };
    }

    const [ordersMoved, transactionsMoved, discountUsageMoved] =
      await Promise.all([
        reassignOrdersToUser(guestUser._id, realUser._id, session),
        reassignTransactionsToUser(guestUser._id, realUser._id, session),
        reassignDiscountUsageToUser(guestUser._id, realUser._id, session),
      ]);

    guestUser.guestMergedInto = realUser._id;
    guestUser.guestLastSeenAt = new Date();
    await guestUser.save({ session });

    await session.commitTransaction();

    logger.info(
      `[guestMergeService] Merged guest ${guestUserId} into user ${realUserId}. Orders: ${ordersMoved}, Transactions: ${transactionsMoved}, DiscountUsage: ${discountUsageMoved}`
    );

    return {
      merged: true,
      ordersMoved,
      transactionsMoved,
      discountUsageMoved,
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[guestMergeService] Merge failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
}
