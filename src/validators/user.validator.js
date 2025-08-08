import Joi from "joi";
import { EMAIL_REGEX, OBJECTID_REGEX, STRONG_PASSWORD_REGEX } from "../utils/validators.js";


/**
 * Joi schema for a single item in the user's cart.
 *
 * - productId: required, ObjectId string
 * - quantity: required, number, min 1
 */
export const cartItemSchema = Joi.object({
  productId: Joi.string().regex(OBJECTID_REGEX).required(),// validate productId (ObjectId string)
  quantity: Joi.number().min(1).required()// validate quantity (min 1)
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

export const userValidator =  Joi.object(
  {
    displayName: Joi.string().min(3).max(30).trim().optional(),// validate username (3-30 chars)
    email: Joi.string().trim().lowercase().pattern(EMAIL_REGEX).required(), // validate email format
    googleId: Joi.string().trim().optional(), // optional Google ID
    password: Joi.string().pattern(STRONG_PASSWORD_REGEX)
      .min(8)
      .max(128)
      .when("googleId", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }), // validate password if googleId is not present
    role: Joi.string().valid("user", "admin").default("user"), // validate role (default to 'user')
    cartItems: Joi.array().items(cartItemSchema).optional(), // validate cart items
    previousOrders: Joi.array().items(Joi.string().regex(OBJECTID_REGEX)).optional() // validate previous orders (ObjectId strings)
  }
)