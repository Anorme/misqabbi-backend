import { Types } from "mongoose";
import logger from "../config/logger.js";
import EventRegistration from "./eventRegistration.mongo.js";

const ACTIVE_REGISTRATION_STATUSES = ["pending", "confirmed"];

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createEventRegistration(registrationData) {
  try {
    return await EventRegistration.create(registrationData);
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error creating event registration: ${error.message}`
    );
    throw error;
  }
}

export async function getPaginatedEventRegistrations(
  eventId,
  page = 1,
  limit = 10,
  params = {}
) {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      return [];
    }

    const filter = { event: eventId };
    const skip = (page - 1) * limit;

    if (params.status) {
      filter.status = params.status;
    }

    if (params.ticketTypeId && Types.ObjectId.isValid(params.ticketTypeId)) {
      filter.ticketTypeId = params.ticketTypeId;
    }

    return await EventRegistration.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "displayName email contact" })
      .populate({ path: "transaction", select: "reference amount status" });
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error listing registrations for event ${eventId}: ${error.message}`
    );
    throw error;
  }
}

export async function countEventRegistrations(eventId, params = {}) {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      return 0;
    }

    const filter = { event: eventId };

    if (params.status) {
      filter.status = params.status;
    }

    if (params.ticketTypeId && Types.ObjectId.isValid(params.ticketTypeId)) {
      filter.ticketTypeId = params.ticketTypeId;
    }

    return await EventRegistration.countDocuments(filter);
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error counting registrations for event ${eventId}: ${error.message}`
    );
    throw error;
  }
}

export async function countConfirmedRegistrations(eventId, params = {}) {
  return countEventRegistrations(eventId, {
    ...params,
    status: "confirmed",
  });
}

export async function findActiveRegistrationByEventAndEmail(eventId, email) {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      return null;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return null;
    }

    return await EventRegistration.findOne({
      event: eventId,
      status: { $in: ACTIVE_REGISTRATION_STATUSES },
      "guestInfo.email": {
        $regex: `^${escapeRegExp(normalizedEmail)}$`,
        $options: "i",
      },
    });
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error finding active registration for event ${eventId} and email ${email}: ${error.message}`
    );
    throw error;
  }
}

export async function getEventRegistrationById(eventId, registrationId) {
  try {
    if (
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(registrationId)
    ) {
      return null;
    }

    return await EventRegistration.findOne({
      _id: registrationId,
      event: eventId,
    })
      .populate({ path: "user", select: "displayName email contact" })
      .populate({ path: "transaction", select: "reference amount status" });
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error finding registration ${registrationId}: ${error.message}`
    );
    throw error;
  }
}

export async function getEventRegistrationByIdOnly(registrationId) {
  try {
    if (!Types.ObjectId.isValid(registrationId)) {
      return null;
    }

    return await EventRegistration.findById(registrationId)
      .populate({ path: "user", select: "displayName email contact" })
      .populate({ path: "transaction", select: "reference amount status" });
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error finding registration ${registrationId}: ${error.message}`
    );
    throw error;
  }
}

export async function updateEventRegistrationPayment(
  registrationId,
  { status, transactionId }
) {
  try {
    if (!Types.ObjectId.isValid(registrationId)) {
      return null;
    }

    const updates = {};
    if (status) updates.status = status;
    if (transactionId) updates.transaction = transactionId;

    return await EventRegistration.findByIdAndUpdate(registrationId, updates, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error updating registration payment ${registrationId}: ${error.message}`
    );
    throw error;
  }
}

export async function cancelEventRegistrationsByIds(registrationIds = []) {
  try {
    const validIds = registrationIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return 0;
    }

    const result = await EventRegistration.updateMany(
      {
        _id: { $in: validIds },
        status: "pending",
      },
      { status: "cancelled" }
    );

    return result?.modifiedCount || 0;
  } catch (error) {
    logger.error(
      `[eventRegistration.model] Error cancelling pending event registrations: ${error.message}`
    );
    throw error;
  }
}
