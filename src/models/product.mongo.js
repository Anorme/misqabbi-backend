import { Schema, model } from "mongoose";
import slugify from "slugify";

/**
 * @typedef Product
 * @property {String} name           - Name of the product (required)
 * @property {String} description    - Description of the product
 * @property {Number} price          - Product price in local currency (required, min: 0)
 * @property {String[]} images       - Array of image URLs (max: 5)
 * @property {Object} swatchImage    - Swatch image for color/print picker (required if isVariant is true)
 * @property {String} category       - Category label (required, lowercase)
 * @property {Number} stock          - Units in stock (required, min: 0)
 * @property {Boolean} isPublished   - Visibility toggle for public listing
 * @property {Boolean} isVariant     - Whether this product is a variant of another product
 * @property {Schema.Types.ObjectId} baseProduct - Reference to base product (required if isVariant is true)
 * @property {String} variantType    - Type of variant: 'color' or 'print' (required if isVariant is true)
 * @property {Schema.Types.ObjectId[]} variants - Array of variant product IDs (on base products only)
 * @property {Schema.Types.ObjectId} createdBy - Admin user who created the product
 * @property {Date} createdAt        - Timestamp of creation (auto-generated)
 * @property {Date} updatedAt        - Timestamp of last update (auto-generated)
 */
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          publicId: { type: String, required: false, trim: true },
        },
      ],
      default: [],
      _id: false,
      validate: {
        validator: function (array) {
          return Array.isArray(array) && array.length <= 5;
        },
        message: "Maximum of 5 images allowed",
      },
      set: function (val) {
        // Backward compatibility: allow strings and coerce to { url }
        if (!Array.isArray(val)) return [];
        return val
          .filter(v => v !== undefined && v !== null)
          .map(v => (typeof v === "string" ? { url: v } : v));
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isVariant: {
      type: Boolean,
      default: false,
      index: true,
    },
    baseProduct: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.isVariant === true;
      },
      index: true,
      default: null,
    },
    variantType: {
      type: String,
      enum: ["color", "print"],
      required: function () {
        return this.isVariant === true;
      },
    },
    variants: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
    swatchImage: {
      type: {
        url: { type: String, required: true, trim: true },
        publicId: { type: String, required: false, trim: true },
      },
      required: function () {
        return this.isVariant === true;
      },
      default: undefined,
      _id: false,
    },
  },
  { timestamps: true }
);

productSchema.index(
  {
    name: "text",
    description: "text",
    category: "text",
  },
  { name: "ProductTextIndex" }
);

productSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

const Product = model("Product", productSchema);
export default Product;
