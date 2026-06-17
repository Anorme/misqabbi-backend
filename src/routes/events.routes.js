import express from "express";
import { rateLimiters } from "../config/rateLimiter.js";
import {
  getPublishedEventBySlug,
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
  "/:slug/register",
  rateLimiters.strict,
  validateEventRegistration,
  authenticateOptionalPrincipal,
  registerForFreeEventPublic
);
router.post(
  "/:slug/checkout",
  rateLimiters.strict,
  validateEventTicketCheckout,
  authenticateOptionalPrincipal,
  initializeEventTicketCheckoutPublic
);
router.post(
  "/:slug/volunteer-applications",
  rateLimiters.strict,
  validateVolunteerApplicationSubmit,
  authenticateOptionalPrincipal,
  submitVolunteerApplicationPublic
);
router.get("/:slug", getPublishedEventBySlug);

export default router;
