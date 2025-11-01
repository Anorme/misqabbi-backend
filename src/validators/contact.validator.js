import Joi from "joi";
import { EMAIL_REGEX } from "../utils/validators.js";

/**
 * Joi validation schema for contact form submission.
 *
 * Fields:
 * - name: required, trimmed string
 * - email: required, lowercase, trimmed, matches email regex
 * - message: required, trimmed string with reasonable length limit
 */
export const contactValidator = Joi.object({
  name: Joi.string().trim().required().max(255),
  email: Joi.string().trim().lowercase().pattern(EMAIL_REGEX).required(),
  message: Joi.string().trim().required().max(5000),
});
