import {
  countEvents,
  getEventById,
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
import { formatResponse } from "../utils/responseFormatter.js";

const PUBLISHED_EVENT_FILTER = "published";

export async function getPublishedEvents(req, res) {
  try {
    const { page, limit, type, q } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const filters = {
      status: PUBLISHED_EVENT_FILTER,
      type: type?.trim() || undefined,
      q: q?.trim() || undefined,
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

export async function getPublishedEventById(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertEventIsPublic(event);

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
      `[events.public.controller] Error loading public event ${req.params.id}: ${error.message}`
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
    const registration = await registerForFreeEvent({
      eventId: req.params.id,
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
      `[events.public.controller] Error registering for event ${req.params.id}: ${error.message}`
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
    const checkout = await initializeEventTicketCheckout({
      eventId: req.params.id,
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
      `[events.public.controller] Error initializing checkout for event ${req.params.id}: ${error.message}`
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
    const application = await submitVolunteerApplication({
      eventId: req.params.id,
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
      `[events.public.controller] Error submitting volunteer application for event ${req.params.id}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}
