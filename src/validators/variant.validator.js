import Joi from "joi";
import { productValidator } from "./product.validator.js";

/**
 * Joi validation schema for Variant Product creation.
 *
 * Extends productValidator with variant-specific fields:
 * - variantType: required, must be 'color' or 'print'
 * - swatchImage: required, object with url and optional publicId
 * - All other fields from productValidator apply
 */

export const variantProductValidator = productValidator.keys({
  variantType: Joi.string().valid("color", "print").required().messages({
    "any.only": "Variant type must be either 'color' or 'print'",
    "any.required": "Variant type is required",
  }),
  swatchImage: Joi.object({
    url: Joi.string().uri().required().messages({
      "string.uri": "Swatch image URL must be a valid URI",
      "any.required": "Swatch image URL is required",
    }),
    publicId: Joi.string().optional(),
  })
    .required()
    .messages({
      "any.required": "Swatch image is required for variants",
    }),
});
