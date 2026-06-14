import Joi from "joi";

export const volunteerApplicationSubmitValidator = Joi.object({
  applicantInfo: Joi.object({
    name: Joi.string().trim().allow("").optional(),
    email: Joi.string().email().trim().required(),
    phone: Joi.string().trim().allow("").optional(),
  }).required(),
  formResponses: Joi.object({
    builtinFields: Joi.object().unknown(true).default({}),
    customAnswers: Joi.object().unknown(true).default({}),
  }).default({ builtinFields: {}, customAnswers: {} }),
});
