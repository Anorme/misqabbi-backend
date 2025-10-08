import { Schema, model } from "mongoose";
import slugify from "slugify";

/**
 * @typedef Product
 * @property {String} name           - Name of the product (required)
 * @property {String} description    - Description of the product
 * @property {Number} price          - Product price in local currency (required, min: 0)
 * @property {String[]} images       - Array of image URLs (max: 5)
 * @property {String} category       - Category label (required, lowercase)
 * @property {Number} stock          - Units in stock (required, min: 0)
 * @property {Boolean} isPublished   - Visibility toggle for public listing
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
      type: [String],
      default: [],
      validate: {
        validator: function (array) {
          return array.length <= 5;
        },
        message: "Maximum of 5 images allowed",
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
