import express from "express";
import { rateLimiters } from "../config/rateLimiter.js";
import {
  getPublishedEventById,
  getPublishedEvents,
  initializeEventTicketCheckoutPublic,
  registerForFreeEventPublic,
  submitVolunteerApplicationPublic,
} from "../controllers/events.public.controller.js";
import { authenticateOptionalPrincipal } from "../middleware/index.js";
import {
  validateEventRegistration,
  validateEventTicketCheckout,
  validateVolunteerApplicationSubmit,
} from "../middleware/validator.middleware.js";

const router = express.Router();

router.get("/", getPublishedEvents);
router.post(
  "/:id/register",
  rateLimiters.strict,
  validateEventRegistration,
  authenticateOptionalPrincipal,
  registerForFreeEventPublic
);
router.post(
  "/:id/checkout",
  rateLimiters.strict,
  validateEventTicketCheckout,
  authenticateOptionalPrincipal,
  initializeEventTicketCheckoutPublic
);
router.post(
  "/:id/volunteer-applications",
  rateLimiters.strict,
  validateVolunteerApplicationSubmit,
  authenticateOptionalPrincipal,
  submitVolunteerApplicationPublic
);
router.get("/:id", getPublishedEventById);

export default router;
