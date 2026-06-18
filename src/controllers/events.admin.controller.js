import {
  addTicketTypeToEvent,
  countEvents,
  createEvent,
  deleteEventTicketType,
  getEventById,
  getPaginatedEvents,
  setEventRegistrationForm,
  setEventVolunteerForm,
  updateEvent,
  updateEventTicketType,
  updateEventStatus,
} from "../models/event.model.js";
import {
  createFormSchema,
  getFormSchemaById,
  updateFormSchema,
} from "../models/formSchema.model.js";
import {
  cancelEventRegistrationsByIds,
  countEventRegistrations,
  getEventRegistrationById,
  getPaginatedEventRegistrations,
} from "../models/eventRegistration.model.js";
import {
  abandonPendingEventTicketTransactions,
  getPendingEventTicketRegistrationIds,
} from "../models/transaction.model.js";
import {
  countVolunteerApplications,
  getPaginatedVolunteerApplications,
  getVolunteerApplicationById,
  updateVolunteerApplicationStatus,
} from "../models/volunteerApplication.model.js";
import { deleteAssets } from "../config/cloudinary.js";
import logger from "../config/logger.js";
import {
  assertEventSupportsRegistrationForm,
  getLinkedFormId,
} from "../services/eventFormService.js";
import { assertEventStatusTransition } from "../services/eventStatusService.js";
import { initializeEventTicketCheckout } from "../services/eventCheckoutService.js";
import {
  assertCanDeleteTicketType,
  assertCanUpdateTicketType,
  assertPaidEventCanPublish,
  assertPaidEventSupportsTickets,
  buildTicketTypePayload,
} from "../services/eventTicketService.js";
import { assertVolunteerApplicationStatusTransition } from "../services/volunteerApplicationService.js";
import { formatResponse } from "../utils/responseFormatter.js";
import { cleanupUploadedEventBanner } from "../middleware/upload.middleware.js";

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
    await cleanupUploadedEventBanner(req);
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

    if (payload.banner !== undefined && existing.banner?.publicId) {
      const incomingPublicId = payload.banner?.publicId ?? null;
      try {
        if (existing.banner.publicId !== incomingPublicId) {
          await deleteAssets([existing.banner.publicId]);
        }
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
    await cleanupUploadedEventBanner(req);
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

    let abandonedTransactions = 0;
    let cancelledRegistrations = 0;
    if (req.body.status === "cancelled") {
      const pendingRegistrationIds = await getPendingEventTicketRegistrationIds(
        existing._id
      );
      abandonedTransactions = await abandonPendingEventTicketTransactions(
        existing._id
      );
      cancelledRegistrations = await cancelEventRegistrationsByIds(
        pendingRegistrationIds
      );
    }

    const event = await updateEventStatus(req.params.id, req.body.status);

    res.status(200).json(
      formatResponse({
        message: "Event status updated successfully",
        data: event,
        ...(req.body.status === "cancelled" && {
          abandonedTransactions,
          cancelledRegistrations,
        }),
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

export async function upsertEventRegistrationFormAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertEventSupportsRegistrationForm(event);

    const existingFormId = getLinkedFormId(event);
    const registrationForm = existingFormId
      ? await updateFormSchema(existingFormId, { ...req.body })
      : await createFormSchema(req.body, req.user._id);

    const updatedEvent = existingFormId
      ? event
      : await setEventRegistrationForm(req.params.id, registrationForm._id);

    res.status(existingFormId ? 200 : 201).json(
      formatResponse({
        message: "Registration form configured successfully",
        data: {
          event: updatedEvent,
          registrationForm,
        },
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error configuring registration form for event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function getEventRegistrationFormAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertEventSupportsRegistrationForm(event);

    const registrationFormId = getLinkedFormId(event);
    if (!registrationFormId) {
      return res.status(200).json(formatResponse({ data: null }));
    }

    const registrationForm = await getFormSchemaById(registrationFormId);
    if (!registrationForm) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Registration form not found",
        })
      );
    }

    res.status(200).json(
      formatResponse({
        data: registrationForm,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error loading registration form for event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function upsertEventVolunteerFormAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertEventSupportsRegistrationForm(event);

    const existingFormId = getLinkedFormId(event, "volunteerFormId");
    const volunteerForm = existingFormId
      ? await updateFormSchema(existingFormId, { ...req.body })
      : await createFormSchema(req.body, req.user._id);

    const updatedEvent = existingFormId
      ? event
      : await setEventVolunteerForm(req.params.id, volunteerForm._id);

    res.status(existingFormId ? 200 : 201).json(
      formatResponse({
        message: "Volunteer form configured successfully",
        data: {
          event: updatedEvent,
          volunteerForm,
        },
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error configuring volunteer form for event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function getEventVolunteerFormAdmin(req, res) {
  try {
    const event = await getEventById(req.params.id);
    assertEventSupportsRegistrationForm(event);

    const volunteerFormId = getLinkedFormId(event, "volunteerFormId");
    if (!volunteerFormId) {
      return res.status(200).json(formatResponse({ data: null }));
    }

    const volunteerForm = await getFormSchemaById(volunteerFormId);
    if (!volunteerForm) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Volunteer form not found",
        })
      );
    }

    res.status(200).json(formatResponse({ data: volunteerForm }));
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error loading volunteer form for event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function getVolunteerApplicationsAdmin(req, res) {
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

    const { page, limit, status } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const filters = { status: status?.trim() || undefined };
    const total = await countVolunteerApplications(req.params.id, filters);

    if (pageNum > Math.ceil(total / limitNum) && total > 0) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Requested page exceeds available volunteer application pages",
        })
      );
    }

    const applications = await getPaginatedVolunteerApplications(
      req.params.id,
      pageNum,
      limitNum,
      filters
    );

    res.status(200).json(
      formatResponse({
        data: applications,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error listing volunteer applications for event ${req.params.id}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load volunteer applications",
      })
    );
  }
}

export async function getVolunteerApplicationByIdAdmin(req, res) {
  try {
    const application = await getVolunteerApplicationById(
      req.params.id,
      req.params.applicationId
    );

    if (!application) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Volunteer application not found",
        })
      );
    }

    res.status(200).json(formatResponse({ data: application }));
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error loading volunteer application ${req.params.applicationId}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load volunteer application",
      })
    );
  }
}

export async function updateVolunteerApplicationStatusAdmin(req, res) {
  try {
    const application = await getVolunteerApplicationById(
      req.params.id,
      req.params.applicationId
    );

    if (!application) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Volunteer application not found",
        })
      );
    }

    assertVolunteerApplicationStatusTransition(
      application.status,
      req.body.status
    );

    const updatedApplication = await updateVolunteerApplicationStatus(
      req.params.id,
      req.params.applicationId,
      req.body.status
    );

    res.status(200).json(
      formatResponse({
        message: "Volunteer application status updated successfully",
        data: updatedApplication,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error updating volunteer application ${req.params.applicationId}: ${error.message}`
    );
    res.status(400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}

export async function getEventAttendeesAdmin(req, res) {
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

    const { page, limit, status, ticketTypeId } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const filters = {
      status: status?.trim() || undefined,
      ticketTypeId: ticketTypeId?.trim() || undefined,
    };
    const total = await countEventRegistrations(req.params.id, filters);

    if (pageNum > Math.ceil(total / limitNum) && total > 0) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Requested page exceeds available attendee pages",
        })
      );
    }

    const attendees = await getPaginatedEventRegistrations(
      req.params.id,
      pageNum,
      limitNum,
      filters
    );

    res.status(200).json(
      formatResponse({
        data: attendees,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      })
    );
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error listing attendees for event ${req.params.id}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load attendees",
      })
    );
  }
}

export async function getEventAttendeeByIdAdmin(req, res) {
  try {
    const attendee = await getEventRegistrationById(
      req.params.id,
      req.params.registrationId
    );

    if (!attendee) {
      return res.status(404).json(
        formatResponse({
          success: false,
          error: "Attendee not found",
        })
      );
    }

    res.status(200).json(formatResponse({ data: attendee }));
  } catch (error) {
    logger.error(
      `[events.admin.controller] Error loading attendee ${req.params.registrationId}: ${error.message}`
    );
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Failed to load attendee",
      })
    );
  }
}

export async function initializeEventTicketCheckoutAdmin(req, res) {
  try {
    const principal = {
      type: "user",
      _id: req.user._id,
      user: req.user,
    };
    const checkout = await initializeEventTicketCheckout({
      eventId: req.params.id,
      principal,
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
    logger.error(
      `[events.admin.controller] Error initializing event ticket checkout for event ${req.params.id}: ${error.message}`
    );
    res.status(error.message === "Event not found" ? 404 : 400).json(
      formatResponse({
        success: false,
        error: error.message,
      })
    );
  }
}
