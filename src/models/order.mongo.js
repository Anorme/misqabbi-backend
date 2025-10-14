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
      },
    ],

    // Total price of the entire order
    totalPrice: {
      type: Number,
      min: 0,
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
