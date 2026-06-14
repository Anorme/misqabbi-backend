import Joi from "joi";
import { EVENT_TYPES, EVENT_STATUSES } from "../models/event.mongo.js";

const venueValidator = Joi.object({
  name: Joi.string().trim().allow("").optional(),
  address: Joi.string().trim().allow("").optional(),
  url: Joi.string().trim().uri().allow("").optional(),
}).optional();

const bannerValidator = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().trim().required(),
})
  .allow(null)
  .optional();

export const eventValidator = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    "string.empty": "Event name is required",
    "any.required": "Event name is required",
  }),
  description: Joi.string().trim().min(1).required().messages({
    "string.empty": "Event description is required",
    "any.required": "Event description is required",
  }),
  eventDate: Joi.date().iso().required().messages({
    "date.base": "Event date must be a valid date",
    "any.required": "Event date is required",
  }),
  type: Joi.string()
    .valid(...EVENT_TYPES)
    .required(),
  maxAttendees: Joi.number().integer().min(1).required().messages({
    "number.min": "Event size must be at least 1",
    "any.required": "Event size is required",
  }),
  venue: venueValidator,
  banner: bannerValidator,
});

export const eventStatusValidator = Joi.object({
  status: Joi.string()
    .valid(...EVENT_STATUSES)
    .required(),
});
