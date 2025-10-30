import Joi from "joi";
import mongoose from "mongoose";

/**
 * Joi validation schema for Product creation/update.
 *
 * Fields:
 * - name: required, string, trimmed, non-empty
 * - description: optional, string, trimmed
 * - price: required, number, min 0
 * - images: optional, array of strings (URLs), max length 5
 * - category: required, string, lowercase, trimmed
 * - stock: required, number, min 0
 * - isPublished: optional, boolean
 * - createdBy: optional, valid ObjectId string (references User)
 */

export const productValidator = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Product name is required",
  }),
  description: Joi.string().trim().optional(),
  price: Joi.number().min(0).required().messages({
    "number.min": "Price must be at least 0",
    "any.required": "Price is required",
  }),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().optional(),
      })
    )
    .max(5)
    .optional()
    .messages({
      "array.max": "Maximum of 5 images allowed",
      "string.uri": "Invalid image URL format",
    }),
  category: Joi.string().lowercase().trim().required(),
  stock: Joi.number().min(0).required().messages({
    "number.min": "Stock must be at least 0",
    "any.required": "Stock is required",
  }),
  isPublished: Joi.boolean().optional(),
  createdBy: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value; // must return the value if valid
    }, "ObjectId Validation")
    .optional(),
});
