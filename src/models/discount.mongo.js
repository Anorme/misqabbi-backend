import { Schema, model } from "mongoose";

/**
 * @typedef Discount
 * @property {String} code              - Unique discount code (uppercase, trimmed)
 * @property {String} description       - Optional admin notes/description
 * @property {String} discountType      - Type: 'percentage' or 'fixed'
 * @property {Number} discountValue     - Value (e.g., 10 for 10% or 50 for GHS 50)
 * @property {Number} maxDiscountAmount - Optional cap for percentage discounts
 * @property {String} scope             - 'order' (entire cart) or 'products' (specific items)
 * @property {ObjectId[]} applicableProducts   - Products this discount applies to (when scope is 'products')
 * @property {String[]} applicableCategories   - Categories this discount applies to (when scope is 'products')
 * @property {String} usageType         - 'single_use', 'multi_use', or 'per_user'
 * @property {Number} maxGlobalUses     - Optional total usage limit across all users
 * @property {Number} maxUsesPerUser    - Max times a single user can use this code
 * @property {Number} currentGlobalUses - Tracks total number of uses
 * @property {Number} minOrderValue     - Optional minimum cart value (GHS)
 * @property {Number} minItemCount      - Optional minimum item count
 * @property {Boolean} firstOrderOnly   - Restrict to first-time customers
 * @property {Date} expiryDate          - When the discount expires
 * @property {Boolean} isActive         - Whether the discount is currently active
 * @property {ObjectId} createdBy       - Admin user who created the discount
 */
const discountSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Discount Value
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          // For percentage discounts, value should be between 0 and 100
          if (this.discountType === "percentage") {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: "Percentage discount value must be between 0 and 100",
      },
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    // Scope
    scope: {
      type: String,
      enum: ["order", "products"],
      required: true,
      default: "order",
    },
    applicableProducts: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
    applicableCategories: {
      type: [String],
      default: [],
      set: function (categories) {
        // Normalize categories to lowercase
        if (!Array.isArray(categories)) return [];
        return categories.map(cat =>
          typeof cat === "string" ? cat.toLowerCase().trim() : cat
        );
      },
    },

    // Usage Restrictions
    usageType: {
      type: String,
      enum: ["single_use", "multi_use", "per_user"],
      required: true,
      default: "multi_use",
    },
    maxGlobalUses: {
      type: Number,
      min: 1,
      default: null,
    },
    maxUsesPerUser: {
      type: Number,
      min: 1,
      default: 1,
    },
    currentGlobalUses: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Requirements
    minOrderValue: {
      type: Number,
      min: 0,
      default: null,
    },
    minItemCount: {
      type: Number,
      min: 1,
      default: null,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },

    // Validity
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookups of active, non-expired discounts
discountSchema.index({ isActive: 1, expiryDate: 1 });

// Text index for admin search
discountSchema.index(
  { code: "text", description: "text" },
  { name: "DiscountTextIndex" }
);

/**
 * Check if the discount has reached its global usage limit.
 * @returns {Boolean} - True if usage limit reached, false otherwise
 */
discountSchema.methods.hasReachedGlobalLimit = function () {
  if (this.usageType === "single_use") {
    return this.currentGlobalUses >= 1;
  }
  if (this.maxGlobalUses !== null) {
    return this.currentGlobalUses >= this.maxGlobalUses;
  }
  return false;
};

/**
 * Check if the discount is currently valid (active and not expired).
 * @returns {Boolean} - True if valid, false otherwise
 */
discountSchema.methods.isValid = function () {
  return this.isActive && this.expiryDate > new Date();
};

const Discount = model("Discount", discountSchema);
export default Discount;
