import Joi from "joi";
import mongoose from "mongoose";

/**
 * Joi validation schema for Transaction creation/update.
 *
 * Fields:
 * - reference: required, string (Paystack transaction reference)
 * - user: required, valid ObjectId string (references User)
 * - amount: required, number, min 1 (amount in pesewas)
 * - currency: optional, string, one of ['GHS', 'NGN', 'USD', 'ZAR'], defaults to 'GHS'
 * - status: optional, string, one of ['pending', 'success', 'failed', 'abandoned'], defaults to 'pending'
 * - orderData: required, object containing items and shippingInfo
 */

export const transactionValidator = Joi.object({
  reference: Joi.string().trim().required(),

  user: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation")
    .messages({
      "any.invalid": "Invalid MongoDB ObjectId in user",
    })
    .required(),

  amount: Joi.number().min(1).required(), // Amount in pesewas

  currency: Joi.string().valid("GHS", "NGN", "USD", "ZAR").default("GHS"),

  status: Joi.string()
    .valid("pending", "success", "failed", "abandoned")
    .default("pending"),

  orderData: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          product: Joi.string()
            .custom((value, helpers) => {
              if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error("any.invalid");
              }
              return value;
            }, "ObjectId Validation")
            .messages({ "any.invalid": "Invalid MongoDB ObjectId in product" })
            .required(),
          quantity: Joi.number().min(1).required(),
          price: Joi.number().min(0).required(),
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
    shippingInfo: Joi.object({
      fullName: Joi.string().trim().required(),
      email: Joi.string().email().trim().lowercase().required(),
      phone: Joi.string().trim().required(),
      deliveryAddress: Joi.string().trim().required(),
      deliveryNotes: Joi.string().trim().allow("").optional(),
    }).required(),
    totalPrice: Joi.number().min(0).required(),
  }).required(),

  paystackResponse: Joi.object().optional(),
  order: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation")
    .messages({ "any.invalid": "Invalid MongoDB ObjectId in order" })
    .optional(),
});
