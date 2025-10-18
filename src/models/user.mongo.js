import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

import logger from "../config/logger.js";
import {
  EMAIL_REGEX,
  isPasswordValidOrGoogleUser,
} from "../utils/validators.js";

/**
 * Schema for individual items in the user's favorites.
 *
 * - Embedded directly in the user document for fast access.
 * - References a Product by ObjectId.
 * - Does not generate its own _id to keep the structure lean.
 */
const favoriteItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
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
 * - favorites {Array<FavoriteItem>} embedded for quick access
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
    googleId: {
      type: String,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      validate: {
        validator: function (value) {
          const isNewOrChanged = this.isModified("password");
          return !isNewOrChanged || isPasswordValidOrGoogleUser(value, this);
        },
        message: "Password required for local accounts",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    contact: { type: String },
    location: { type: String },
    profileComplete: { type: Boolean, default: false },

    favorites: [favoriteItemSchema], // Embedded for fast access and frequent updates
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
    const shouldHash = this.isModified("password") && this.password;
    if (!shouldHash) return next();
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

userSchema.virtual("authProvider").get(function () {
  return this.googleId ? "google" : "local";
});

const User = model("User", userSchema);
export default User;
