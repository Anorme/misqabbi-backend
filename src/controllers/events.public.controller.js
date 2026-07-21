import {
  countEvents,
  getEventBySlug,
  getPaginatedEvents,
} from "../models/event.model.js";
import logger from "../config/logger.js";
import { getConfirmedCount } from "../services/eventCapacityService.js";
import {
  assertEventIsPublic,
  toPublicEventDetail,
  toPublicEventListItem,
} from "../services/eventPublicService.js";
import { initializeEventTicketCheckout } from "../services/eventCheckoutService.js";
import { registerForFreeEvent } from "../services/eventRegistrationService.js";
import { submitVolunteerApplication } from "../services/volunteerApplicationService.js";
import { resolvePublicWhenFilter } from "../services/eventWhenLogic.js";
import { formatResponse } from "../utils/responseFormatter.js";

const PUBLISHED_EVENT_FILTER = "published";

async function resolvePublishedEventBySlug(slug) {
  const event = await getEventBySlug(slug);
  assertEventIsPublic(event);
  return event;
}

export async function getPublishedEvents(req, res) {
  try {
    const { page, limit, type, q, when } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const whenFilter = resolvePublicWhenFilter(when);
    const filters = {
      status: PUBLISHED_EVENT_FILTER,
      type: type?.trim() || undefined,
      q: q?.trim() || undefined,
      when: whenFilter === "all" ? undefined : whenFilter,
    };

    const total = await countEvents(filters);

    if (pageNum > Math.ceil(total / limitNum) && total > 0) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Requested page exceeds available event pages",
        })
      );
    }

    const events = await getPaginatedEvents(pageNum, limitNum, filters);

    res.status(200).json(
      formatResponse({
        data: events.map(toPublicEventListItem),
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    if (error.message.startsWith("Invalid when filter")) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: error.message,
        })
      );
    }

    logger.error(
      `[events.public.controller] Error listing public events: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load events",
      })
    );
  }
}

export async function getPublishedEventBySlug(req, res) {
  try {
    const event = await resolvePublishedEventBySlug(req.params.slug);

    const confirmedCount = await getConfirmedCount(event._id);

    res.status(200).json(
      formatResponse({
        data: toPublicEventDetail(event, confirmedCount),
      })
    );
  } catch (error) {
    if (error.message === "Event not found") {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    logger.error(
      `[events.public.controller] Error loading public event ${req.params.slug}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load event",
      })
    );
  }
}

export async function registerForFreeEventPublic(req, res) {
  try {
    const event = await resolvePublishedEventBySlug(req.params.slug);
    const registration = await registerForFreeEvent({
      eventId: event._id,
      principal: req.principal,
      guestInfo: req.body.guestInfo,
      formResponses: req.body.formResponses,
    });

    res.status(201).json(
      formatResponse({
        message: "Event registration confirmed successfully",
        data: registration,
      })
    );
  } catch (error) {
    if (error.message === "Event not found") {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    logger.error(
      `[events.public.controller] Error registering for event ${req.params.slug}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function initializeEventTicketCheckoutPublic(req, res) {
  try {
    const event = await resolvePublishedEventBySlug(req.params.slug);
    const checkout = await initializeEventTicketCheckout({
      eventId: event._id,
      principal: req.principal,
      ticketTypeId: req.body.ticketTypeId,
      quantity: req.body.quantity,
      guestInfo: req.body.guestInfo,
      formResponses: req.body.formResponses,
    });

    res.status(200).json(
      formatResponse({
        message: "Event ticket payment initialized successfully",
        data: checkout,
      })
    );
  } catch (error) {
    if (error.message === "Event not found") {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    logger.error(
      `[events.public.controller] Error initializing checkout for event ${req.params.slug}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function submitVolunteerApplicationPublic(req, res) {
  try {
    const event = await resolvePublishedEventBySlug(req.params.slug);
    const application = await submitVolunteerApplication({
      eventId: event._id,
      applicantInfo: req.body.applicantInfo,
      formResponses: req.body.formResponses,
    });

    res.status(201).json(
      formatResponse({
        message: "Volunteer application submitted successfully",
        data: application,
      })
    );
  } catch (error) {
    if (error.message === "Event not found") {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    logger.error(
      `[events.public.controller] Error submitting volunteer application for event ${req.params.slug}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}
