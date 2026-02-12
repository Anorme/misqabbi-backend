import Joi from "joi";
import { EMAIL_REGEX } from "../utils/validators.js";

const GARMENT_TYPES = ["pants", "skirts", "dresses", "dungarees", "other"];

function measurementsJsonValidator(value, helpers) {
  if (value === undefined || value === null || value === "") return value;
  try {
    JSON.parse(value);
    return value;
  } catch {
    return helpers.error("any.invalid");
  }
}

/**
 * Joi validation schema for bespoke form submission (multipart/form-data).
 * Fields: fullName, email, phone, garmentType, garmentTypeOther, measurements, styleNotes, description.
 * referencePhotoUrls is set by upload middleware after Cloudinary upload.
 */
export const bespokeValidator = Joi.object({
  fullName: Joi.string().trim().required().max(255),
  email: Joi.string().trim().lowercase().pattern(EMAIL_REGEX).required(),
  phone: Joi.string().trim().allow("").max(50),
  garmentType: Joi.string()
    .trim()
    .valid(...GARMENT_TYPES, "")
    .allow(""),
  garmentTypeOther: Joi.string().trim().allow("").max(100),
  measurements: Joi.string()
    .trim()
    .allow("")
    .max(2000)
    .when("garmentType", {
      is: Joi.valid("pants", "skirts", "dresses", "dungarees"),
      then: Joi.custom(measurementsJsonValidator).messages({
        "any.invalid":
          "measurements must be valid JSON when garment type is a known category",
      }),
      otherwise: Joi.string().trim().allow("").max(2000),
    }),
  styleNotes: Joi.string().trim().allow("").max(2000),
  description: Joi.string().trim().required().min(10).max(5000),
  referencePhotoUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
});
