import Joi from "joi";
import mongoose from "mongoose";
import {
  BUILTIN_FORM_FIELDS,
  FORM_QUESTION_TYPES,
} from "../models/formSchema.mongo.js";

const uniqueBy = key => (value, helpers) => {
  if (!Array.isArray(value)) return value;

  const seen = new Set();
  for (const item of value) {
    const itemKey = item?.[key];
    if (seen.has(itemKey)) {
      return helpers.error("array.unique", { key });
    }
    seen.add(itemKey);
  }

  return value;
};

const builtinFieldValidator = Joi.object({
  field: Joi.string()
    .valid(...BUILTIN_FORM_FIELDS)
    .required(),
  required: Joi.boolean().default(false),
});

const customQuestionValidator = Joi.object({
  id: Joi.string().trim().min(1).required(),
  label: Joi.string().trim().min(1).required(),
  type: Joi.string()
    .valid(...FORM_QUESTION_TYPES)
    .required(),
  required: Joi.boolean().default(false),
  options: Joi.when("type", {
    is: "select",
    then: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
    otherwise: Joi.array().items(Joi.string().trim().min(1)).default([]),
  }),
});

export const formSchemaValidator = Joi.object({
  builtinFields: Joi.array()
    .items(builtinFieldValidator)
    .custom(uniqueBy("field"), "Unique builtin field validation")
    .default([]),
  customQuestions: Joi.array()
    .items(customQuestionValidator)
    .custom(uniqueBy("id"), "Unique custom question validation")
    .default([]),
  createdBy: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "ObjectId Validation")
    .optional(),
});
