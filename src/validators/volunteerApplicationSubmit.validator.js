import Joi from "joi";

export const volunteerApplicationSubmitValidator = Joi.object({
  applicantInfo: Joi.object({
    name: Joi.string().trim().allow("").optional(),
    email: Joi.string().email().trim().required(),
    phone: Joi.string().trim().allow("").optional(),
  }).required(),
  formResponses: Joi.object({
    builtinFields: Joi.forbidden().messages({
      "any.unknown": "formResponses.builtinFields is no longer supported",
    }),
    customAnswers: Joi.object().unknown(true).default({}),
  }).default({ customAnswers: {} }),
});
