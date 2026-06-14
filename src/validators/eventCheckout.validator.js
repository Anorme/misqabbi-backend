import Joi from "joi";
import mongoose from "mongoose";

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

export const eventTicketCheckoutValidator = Joi.object({
  ticketTypeId: Joi.string()
    .custom(objectIdValidator, "ObjectId Validation")
    .required(),
  quantity: Joi.number().integer().min(1).required(),
  guestInfo: Joi.object({
    name: Joi.string().trim().allow("").optional(),
    email: Joi.string().email().trim().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
  }).default({}),
  formResponses: Joi.object({
    builtinFields: Joi.forbidden().messages({
      "any.unknown": "formResponses.builtinFields is no longer supported",
    }),
    customAnswers: Joi.object().unknown(true).default({}),
  }).default({ customAnswers: {} }),
});
