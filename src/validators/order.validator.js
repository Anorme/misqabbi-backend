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
      if (!mongoose.Types.objectId.isValid(value)) {
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
      })
    )
    .required(),
  totalPrice: Joi.number().min(0).optional(), // validate total price (min 0)
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
