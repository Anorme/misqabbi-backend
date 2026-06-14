import express from "express";
import { rateLimiters } from "../config/rateLimiter.js";
import {
  getPublishedEventById,
  getPublishedEvents,
  initializeEventTicketCheckoutPublic,
  registerForFreeEventPublic,
} from "../controllers/events.public.controller.js";
import { authenticateOptionalPrincipal } from "../middleware/index.js";
import {
  validateEventRegistration,
  validateEventTicketCheckout,
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
router.get("/:id", getPublishedEventById);

export default router;
