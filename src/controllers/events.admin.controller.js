import {
  addTicketTypeToEvent,
  countEvents,
  createEvent,
  deleteEventTicketType,
  getEventById,
  getPaginatedEvents,
  updateEvent,
  updateEventTicketType,
  updateEventStatus,
} from "../models/event.model.js";
import { deleteAssets } from "../config/cloudinary.js";
import logger from "../config/logger.js";
import { assertEventStatusTransition } from "../services/eventStatusService.js";
import {
  assertCanDeleteTicketType,
  assertCanUpdateTicketType,
  assertPaidEventCanPublish,
  assertPaidEventSupportsTickets,
  buildTicketTypePayload,
} from "../services/eventTicketService.js";
import { formatResponse } from "../utils/responseFormatter.js";

export async function createEventAdmin(req, res) {
  try {
    const event = await createEvent(req.body, req.user._id);

    res.status(201).json(
      formatResponse({
        message: "Event created successfully",
        data: event,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error creating event: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        message: "Event creation failed",
        error: "Invalid event data",
      })
    );
  }
}

export async function getEventsAdmin(req, res) {
  try {
    const { page, limit, status, type, q } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const filters = {
      status: status?.trim() || undefined,
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
        data: events,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error listing events: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load events",
      })
    );
  }
}

export async function getEventByIdAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);

    if (!event) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    res.status(200).json(formatResponse({ data: event }));
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error loading event ${req.params.id}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load event",
      })
    );
  }
}

export async function updateEventAdmin(req, res) {
  try {
    const existing = await getEventById(req.params.id);

    if (!existing) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    const payload = { ...req.body };

    if (payload.banner && existing.banner?.publicId) {
      try {
        await deleteAssets([existing.banner.publicId]);
      } catch (error) {
        logger.warn(
          `[events.admin.controller] Failed to delete replaced event banner ${existing._id}: ${error.message}`
        );
      }
    }

    const event = await updateEvent(req.params.id, payload);

    res.status(200).json(
      formatResponse({
        message: "Event updated successfully",
        data: event,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error updating event ${req.params.id}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        message: "Event update failed",
        error: "Invalid event data",
      })
    );
  }
}

export async function updateEventStatusAdmin(req, res) {
  try {
    const existing = await getEventById(req.params.id);

    if (!existing) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Event not found",
        })
      );
    }

    assertEventStatusTransition(existing.status, req.body.status);
    if (req.body.status === "published") {
      assertPaidEventCanPublish(existing);
    }

    const event = await updateEventStatus(req.params.id, req.body.status);

    res.status(200).json(
      formatResponse({
        message: "Event status updated successfully",
        data: event,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error updating event status ${req.params.id}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function addEventTicketTypeAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertPaidEventSupportsTickets(event);

    const ticketTypePayload = buildTicketTypePayload(req.body, event);
    const updatedEvent = await addTicketTypeToEvent(
      req.params.id,
      ticketTypePayload
    );

    res.status(201).json(
      formatResponse({
        message: "Ticket type added successfully",
        data: updatedEvent,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error adding ticket type to event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function updateEventTicketTypeAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertPaidEventSupportsTickets(event);

    const ticketType = event.ticketTypes.id(req.params.ticketTypeId);
    assertCanUpdateTicketType(ticketType, req.body);

    const updates = { ...req.body };
    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
      updates.expirySource = "manual";
    }

    const result = await updateEventTicketType(
      req.params.id,
      req.params.ticketTypeId,
      updates
    );

    res.status(200).json(
      formatResponse({
        message: "Ticket type updated successfully",
        data: result.event,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error updating ticket type ${req.params.ticketTypeId}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function deleteEventTicketTypeAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertPaidEventSupportsTickets(event);

    const ticketType = event.ticketTypes.id(req.params.ticketTypeId);
    assertCanDeleteTicketType(ticketType);

    const result = await deleteEventTicketType(
      req.params.id,
      req.params.ticketTypeId
    );

    res.status(200).json(
      formatResponse({
        message: "Ticket type deleted successfully",
        data: result.event,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error deleting ticket type ${req.params.ticketTypeId}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}
