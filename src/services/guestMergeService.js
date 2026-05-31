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
    // Sequential reads: MongoDB sessions must not run concurrent ops in a transaction.
    const guestUser = await User.findById(guestUserId).session(session);
    const realUser = await User.findById(realUserId).session(session);

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

    // Sequential writes: same session cannot be used in parallel inside a transaction.
    const ordersMoved = await reassignOrdersToUser(
      guestUser._id,
      realUser._id,
      session
    );
    const transactionsMoved = await reassignTransactionsToUser(
      guestUser._id,
      realUser._id,
      session
    );
    const discountUsageMoved = await reassignDiscountUsageToUser(
      guestUser._id,
      realUser._id,
      session
    );

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
