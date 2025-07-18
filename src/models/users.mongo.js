const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

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
 * - Stores authentication and profile data.
 * - Embeds cart items for quick access.
 * - References previous orders for historical lookup.
 * - Includes role-based access control via 'role' field.
 */
const userSchema = new Schema({
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
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  cartItems: [cartItemSchema], // Embedded for fast access and frequent updates
  previousOrders: [
    {
      orderId: Schema.Types.ObjectId,
      ref: "Order", // Referenced for historical lookup and scalability
    },
  ],
});

/**
 * Hash the password before saving the user.
 *
 * - Only hashes if the password field has been modified.
 * - Uses bcrypt with a salt round of 10.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Compare a candidate password with the stored hash.
 *
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} - Whether the password matches
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema);
module.exports = User;
