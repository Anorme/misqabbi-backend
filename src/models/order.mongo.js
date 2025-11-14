import { Schema, model } from "mongoose";
import User from "./user.mongo.js";
import { OrderItemSchema } from "./schemas/orderItem.schema.js";
import { ShippingInfoSchema } from "./schemas/shippingInfo.schema.js";

// Define the order schema
const OrderSchema = new Schema(
  {
    // Reference to the user who placed the order
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },

    // List of ordered items
    items: [OrderItemSchema],

    // Total price of the entire order
    totalPrice: {
      type: Number,
      min: 0,
    },

    // Shipping information
    shippingInfo: ShippingInfoSchema,

    // Status of the order (enum ensures only allowed values are accepted)
    status: {
      type: String,
      enum: [
        "accepted",
        "processing",
        "ready",
        "enroute_pickup",
        "picked_up",
        "in_transit",
        "arrived",
      ],
      default: "accepted",
    },

    // Payment reference from Paystack transaction
    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["paid", "refunded", "pending"],
      default: "paid", // Orders are only created after successful payment
    },

    // Express service flag
    expressService: {
      type: Boolean,
      default: false,
    },

    // Express service fee amount
    expressFee: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", OrderSchema);

export default Order;
