import Joi from "joi";
import { EMAIL_REGEX } from "../utils/validators.js";

/**
 * Joi validation schema for newsletter subscription.
 *
 * Fields:
 * - email: required, lowercase, trimmed, matches email regex
 */
export const newsletterValidator = Joi.object({
  email: Joi.string().trim().lowercase().pattern(EMAIL_REGEX).required(),
});
