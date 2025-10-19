import { Schema, model } from "mongoose";
import User from "./user.mongo.js";
import Product from "./product.mongo.js";

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
    items: [
      {
        // Reference to the product
        product: {
          type: Schema.Types.ObjectId,
          ref: Product,
          required: true,
        },
        // Quantity of the product ordered
        quantity: {
          type: Number,
          min: 1,
          required: true,
        },
        // Price of the product at time of order
        price: {
          type: Number,
          min: 0,
          required: true,
        },
        // Size of the product (standard sizes or CUSTOM)
        size: {
          type: String,
          enum: ["XS", "S", "M", "L", "XL", "XXL", "CUSTOM"],
          required: true,
        },
        // Custom measurements when size is CUSTOM
        customSize: {
          type: Schema.Types.Mixed,
          required: function () {
            return this.size === "CUSTOM";
          },
        },
      },
    ],

    // Total price of the entire order
    totalPrice: {
      type: Number,
      min: 0,
    },

    // Shipping information
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
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Create the Order model from the schema
const Order = model("Order", OrderSchema);

// Export the model to be used in other parts of the app
export default Order;
