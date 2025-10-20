import { Schema } from "mongoose";

/**
 * ShippingInfoSchema defines the structure for shipping information associated with an order.
 *
 * Fields:
 * - fullName:      (String, required) The name of the recipient.
 * - email:         (String, required) The recipient's email address (stored in lowercase).
 * - phone:         (String, required) The recipient's phone number.
 * - deliveryAddress: (String, required) The shipping address for the delivery.
 * - deliveryNotes: (String, optional) Any additional instructions or notes for delivery.
 *
 * This schema does not include its own _id field; it is meant to be embedded within other documents.
 */
export const ShippingInfoSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    deliveryNotes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);
