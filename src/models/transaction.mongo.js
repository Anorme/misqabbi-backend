import { Schema, model } from "mongoose";
import User from "./user.mongo.js";
import Order from "./order.mongo.js";
import { OrderItemSchema } from "./schemas/orderItem.schema.js";
import { ShippingInfoSchema } from "./schemas/shippingInfo.schema.js";

const TransactionSchema = new Schema(
  {
    // Paystack transaction reference (unique)
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },

    // Amount in pesewas
    amount: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 pesewa
    },

    currency: {
      type: String,
      default: "GHS",
      enum: ["GHS", "NGN", "USD", "ZAR"],
    },

    // Transaction status
    status: {
      type: String,
      enum: ["pending", "success", "failed", "abandoned"],
      default: "pending",
    },

    // Store order data for creating order after successful payment
    orderData: {
      items: [OrderItemSchema],
      shippingInfo: ShippingInfoSchema,
      totalPrice: { type: Number, min: 0, required: true },
      expressService: { type: Boolean, default: false },
      expressFee: { type: Number, min: 0, default: 0 },
    },

    // Store full Paystack response for debugging/audit
    paystackResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: Order,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

const Transaction = model("Transaction", TransactionSchema);

export default Transaction;
