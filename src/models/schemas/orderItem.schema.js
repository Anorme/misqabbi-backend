import { Schema } from "mongoose";

/**
 * Schema for an order item.
 *
 * - product: required, valid ObjectId string (references Product)
 * - quantity: required, number, min 1
 * - price: required, number, min 0
 * - size: required, string, one of ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'CUSTOM']
 * - customSize: optional, object, required when size is 'CUSTOM'
 */
export const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, min: 1, required: true },
    price: { type: Number, min: 0, required: true },
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
  { _id: false }
);
