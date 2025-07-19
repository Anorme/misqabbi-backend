const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const logger = require("../config/logger");

const { EMAIL_REGEX, STRONG_PASSWORD_REGEX } = require("../utils/validators");

/**
 * Schema for individual items in the user's cart.
 *
 * - Embedded directly in the user document for fast access.
 * - References a Product by ObjectId.
 * - Does not generate its own _id to keep the structure lean.
 */
const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

/**
 *  User schema definition.
 *
 * Fields:
 * - email {String} required, unique, trimmed, lowercase
 * - password {String} required (hashed before save)
 * - role {String} enum: 'user' | 'admin'
 * - cartItems {Array<CartItem>} embedded for quick access
 * - previousOrders {Array<ObjectId>} references Order documents
 */
const userSchema = new Schema(
  {
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: EMAIL_REGEX,
    },
    password: {
      type: String,
      required: true,
      match: STRONG_PASSWORD_REGEX,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    cartItems: [cartItemSchema], // Embedded for fast access and frequent updates
    previousOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order", // Referenced for historical lookup and scalability
      },
    ],
  },
  { timestamps: true }
);

/**
 * Hash the password before saving the user.
 *
 * - Only hashes if the password field has been modified.
 * - Uses bcrypt with a salt round of 10.
 */
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    logger.error(`[users.mongo] Error hashing password: ${error.message}`);
    next(error);
  }
});

/**
 * Compare a candidate password with the stored hash.
 *
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} - Whether the password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error(`[users.mongo] Error comparing password: ${error.message}`);
    throw error;
  }
};

const User = model("User", userSchema);
module.exports = User;
