import Joi from "joi";
import { VOLUNTEER_APPLICATION_STATUSES } from "../models/volunteerApplication.mongo.js";

export const volunteerApplicationStatusValidator = Joi.object({
  status: Joi.string()
    .valid(...VOLUNTEER_APPLICATION_STATUSES)
    .required(),
});
