import { Schema, model } from "mongoose";

/**
 * @typedef DiscountUsage
 * @property {ObjectId} discount    - Reference to the Discount document
 * @property {ObjectId} user        - Reference to the User who used the discount
 * @property {ObjectId} order       - Reference to the Order (linked after payment)
 * @property {Date} usedAt          - Timestamp when the discount was used
 * @property {Number} amountSaved   - Actual discount amount applied (in GHS)
 *
 * This collection tracks individual uses of discount codes for:
 * - Enforcing per-user usage limits
 * - Analytics and reporting
 * - Audit trail of discount usage
 */
const discountUsageSchema = new Schema(
  {
    discount: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    amountSaved: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient per-user usage lookups
discountUsageSchema.index({ discount: 1, user: 1 });

// Index for querying usage by order
discountUsageSchema.index({ order: 1 });

const DiscountUsage = model("DiscountUsage", discountUsageSchema);
export default DiscountUsage;
