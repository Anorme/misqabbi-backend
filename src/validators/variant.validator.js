import Joi from "joi";
import { productValidator } from "./product.validator.js";

/**
 * Joi validation schema for Variant Product creation.
 *
 * Extends productValidator with variant-specific fields:
 * - variantType: required, must be 'color' or 'print'
 * - All other fields from productValidator apply
 */

export const variantProductValidator = productValidator.keys({
  variantType: Joi.string().valid("color", "print").required().messages({
    "any.only": "Variant type must be either 'color' or 'print'",
    "any.required": "Variant type is required",
  }),
});
