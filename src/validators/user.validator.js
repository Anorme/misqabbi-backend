import Joi from "joi";
import { EMAIL_REGEX, STRONG_PASSWORD_REGEX } from "../utils/validators.js";
import mongoose from "mongoose";

/**
 * Joi schema for a single item in the user's cart.
 *
 * - productId: required, ObjectId string
 * - quantity: required, number, min 1
 */
export const cartItemSchema = Joi.object({
  productId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value; // must return the value if valid
    })
    .required()
    .messages({ "any.required": "Invalid MongoDB ObjectId in productId" }),
  quantity: Joi.number().min(1).required(), // validate quantity (min 1)
});

/**
 * Joi validation schema for User creation/update.
 *
 * Fields:
 * - displayName: optional, trimmed, min 3, max 30
 * - email: required, lowercase, trimmed, matches email regex
 * - googleId: optional string
 * - password: required if googleId is missing, min 6, max 128
 * - role: 'user' | 'admin'
 * - cartItems: array of validated cartItemSchema
 * - previousOrders: array of ObjectId strings
 */

export const userValidator = Joi.object({
  displayName: Joi.string().min(3).max(30).trim().optional(), // validate username (3-30 chars)
  email: Joi.string().trim().lowercase().pattern(EMAIL_REGEX).required(), // validate email format
  googleId: Joi.string().trim().optional(), // optional Google ID
  password: Joi.string()
    .pattern(STRONG_PASSWORD_REGEX)
    .min(8)
    .max(128)
    .when("googleId", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }), // validate password if googleId is not present
  role: Joi.string().valid("user", "admin").default("user"), // validate role (default to 'user')
  cartItems: Joi.array().items(cartItemSchema).optional(), // validate cart items
  previousOrders: Joi.array().items(
    Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value; // must return the value if valid
      }, "ObjectId Validation")
      .messages({
        "any.invalid": "Invalid MongoDB ObjectId in previousOrders",
      })
  ),
});
