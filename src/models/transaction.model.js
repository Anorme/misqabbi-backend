import Transaction from "./transaction.mongo.js";
import logger from "../config/logger.js";

export async function createTransaction(transactionData) {
  try {
    const transaction = new Transaction(transactionData);
    await transaction.save();
    return transaction;
  } catch (error) {
    logger.warn(
      `[transaction.model] Error creating transaction: ${error.message}`
    );
    throw new Error(error.message);
  }
}

export async function getTransactionByReference(reference) {
  try {
    const transaction = await Transaction.findOne({ reference }).populate({
      path: "user",
      select: "name email",
    });
    return transaction;
  } catch (error) {
    logger.warn(
      `[transaction.model] Error fetching transaction by reference: ${error.message}`
    );
    throw new Error(error.message);
  }
}

export async function updateTransactionStatus(
  reference,
  status,
  orderId = null,
  paystackResponse = null
) {
  try {
    const updateData = { status };

    if (orderId) {
      updateData.order = orderId;
    }

    if (paystackResponse) {
      updateData.paystackResponse = paystackResponse;
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { reference },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({ path: "user", select: "name email" })
      .populate({ path: "order" });

    return updatedTransaction;
  } catch (error) {
    logger.error(
      `[transaction.model] Error updating transaction status: ${error.message}`
    );
    throw error;
  }
}

export async function getTransactionsByUser(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "order", select: "status totalPrice" });

    return transactions;
  } catch (error) {
    logger.warn(
      `[transaction.model] Error fetching user transactions: ${error.message}`
    );
    throw new Error(error.message);
  }
}

export async function countTransactionsByUser(userId) {
  try {
    return await Transaction.countDocuments({ user: userId });
  } catch (error) {
    logger.warn(
      `[transaction.model] Error counting user transactions: ${error.message}`
    );
    throw new Error(error.message);
  }
}

export async function getTransactionById(transactionId, userId) {
  try {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    })
      .populate({ path: "user", select: "name email" })
      .populate({ path: "order" });

    if (!transaction) {
      throw new Error("Transaction not found or access denied");
    }

    return transaction;
  } catch (error) {
    logger.warn(
      `[transaction.model] Error fetching transaction by ID: ${error.message}`
    );
    throw new Error(error.message);
  }
}
