import { Schema, model } from "mongoose";
import User from "./user.mongo.js";
import Order from "./order.mongo.js";

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
      items: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: {
            type: Number,
            min: 1,
            required: true,
          },
          price: {
            type: Number,
            min: 0,
            required: true,
          },
          size: {
            type: String,
            enum: ["XS", "S", "M", "L", "XL", "XXL", "CUSTOM"],
            required: true,
          },
          customSize: {
            type: Schema.Types.Mixed,
            required: function () {
              return this.size === "CUSTOM";
            },
          },
        },
      ],
      shippingInfo: {
        fullName: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        deliveryAddress: {
          type: String,
          required: true,
          trim: true,
        },
        deliveryNotes: {
          type: String,
          trim: true,
          default: "",
        },
      },
      totalPrice: {
        type: Number,
        min: 0,
        required: true,
      },
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
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

const Transaction = model("Transaction", TransactionSchema);

export default Transaction;
