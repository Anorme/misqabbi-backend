import Joi from "joi";
import mongoose from "mongoose";
/**
 * Joi validation schema for Order creation/update.
 *
 * Fields:
 * - user: required, valid ObjectId string (references User)
 * - items: required, array of objects each containing:
 *     - product: required, valid ObjectId string (references Product)
 *     - quantity: required, number, min 1
 *     - price: required, number, min 0
 * - totalPrice: optional, number, min 0
 * - status: optional, string, one of ['accepted', 'processing', 'ready', 'enroute_pickup', 'picked_up', 'in_transit', 'arrived'], defaults to 'accepted'
 */

export const orderValidator = Joi.object({
  user: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value; // must return the value if valid
    }, "ObjectId Validation")
    .messages({
      "any.invalid": "Invalid MongoDB ObjectId in user",
    })
    .required(),
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
              return helpers.error("any.invalid");
            }
            return value; // must return the value if valid
          }, "ObjectId Validation")
          .messages({ "any.invalid": "Invalid MongoDB ObjectId in product" })
          .required(),
        quantity: Joi.number().min(1).required(), // validate quantity (min 1)
        price: Joi.number().min(0).required(), // validate price (min 0)
        size: Joi.string()
          .valid("XS", "S", "M", "L", "XL", "XXL", "CUSTOM")
          .required(),
        customSize: Joi.when("size", {
          is: "CUSTOM",
          then: Joi.object({
            waist: Joi.string().required(),
            hip: Joi.string().required(),
            length: Joi.string().required(),
          }).unknown(true), // Allow additional measurement fields
          otherwise: Joi.forbidden(),
        }),
      })
    )
    .required(),
  totalPrice: Joi.number().min(0).optional(), // validate total price (min 0)
  shippingInfo: Joi.object({
    fullName: Joi.string().trim().required(),
    email: Joi.string().email().trim().lowercase().required(),
    phone: Joi.string().trim().required(),
    deliveryAddress: Joi.string().trim().required(),
    deliveryNotes: Joi.string().trim().allow("").optional(),
  }).required(),
  status: Joi.string()
    .valid(
      "accepted",
      "processing",
      "ready",
      "enroute_pickup",
      "picked_up",
      "in_transit",
      "arrived"
    )
    .default("accepted"), // validate status with default value
});
