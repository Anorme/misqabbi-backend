import Joi from "joi";

export const eventRegistrationValidator = Joi.object({
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
