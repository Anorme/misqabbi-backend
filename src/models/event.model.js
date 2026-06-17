import { Types } from "mongoose";
import Event from "./event.mongo.js";
import logger from "../config/logger.js";
import { recomputeAutoTicketExpiries } from "../services/eventTicketLogic.js";
import {
  buildEventSlug,
  buildEventSlugFamilyFilter,
  buildUniqueEventSlug,
  toRomanLower,
} from "../utils/eventSlug.js";

function isDuplicateSlugError(error) {
  return error?.code === 11000 && Boolean(error?.keyPattern?.slug);
}

async function generateUniqueEventSlug(name) {
  const baseSlug = buildEventSlug(name);
  const existingCount = await Event.countDocuments(
    buildEventSlugFamilyFilter(baseSlug)
  );

  let slug = buildUniqueEventSlug(baseSlug, existingCount);
  let suffixNumber = existingCount + 2;

  while (await Event.exists({ slug })) {
    slug = `${baseSlug}-${toRomanLower(suffixNumber)}`;
    suffixNumber += 1;
  }

  return slug;
}

async function createEventWithSlug(payload, adminId) {
  return Event.create({
    ...payload,
    slug: await generateUniqueEventSlug(payload.name),
    status: "draft",
    createdBy: adminId,
  });
}

export async function createEvent(eventData, adminId) {
  try {
    const payload = { ...eventData };
    delete payload.ticketTypes;
    delete payload.registrationFormId;
    delete payload.volunteerFormId;

    return await createEventWithSlug(payload, adminId);
  } catch (error) {
    if (isDuplicateSlugError(error)) {
      const payload = { ...eventData };
      delete payload.ticketTypes;
      delete payload.registrationFormId;
      delete payload.volunteerFormId;

      return await createEventWithSlug(payload, adminId);
    }

    logger.error(`[event.model] Error creating event: ${error.message}`);
    throw error;
  }
}

export async function getEventById(id) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      logger.warn(`[event.model] Invalid event ID: ${id}`);
      return null;
    }

    return await Event.findById(id)
      .populate("registrationFormId")
      .populate("volunteerFormId");
  } catch (error) {
    logger.error(`[event.model] Error finding event ${id}: ${error.message}`);
    throw error;
  }
}

export async function getEventBySlug(slug) {
  try {
    return await Event.findOne({ slug })
      .populate("registrationFormId")
      .populate("volunteerFormId");
  } catch (error) {
    logger.error(`[event.model] Error finding event ${slug}: ${error.message}`);
    throw error;
  }
}

export async function getPaginatedEvents(page = 1, limit = 10, params = {}) {
  try {
    const filter = {};
    const sort = { eventDate: 1, createdAt: -1 };
    const skip = (page - 1) * limit;

    if (params.status) {
      filter.status = params.status;
    }

    if (params.type) {
      filter.type = params.type;
    }

    if (params.q && typeof params.q === "string") {
      filter.$text = { $search: params.q };
      sort.score = { $meta: "textScore" };
    }

    return await Event.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "createdBy", select: "displayName email" });
  } catch (error) {
    logger.error(`[event.model] Error listing events: ${error.message}`);
    throw error;
  }
}

export async function countEvents(params = {}) {
  try {
    const filter = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.type) {
      filter.type = params.type;
    }

    if (params.q && typeof params.q === "string") {
      filter.$text = { $search: params.q };
    }

    return await Event.countDocuments(filter);
  } catch (error) {
    logger.error(`[event.model] Error counting events: ${error.message}`);
    throw error;
  }
}

export async function updateEvent(id, updates) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const payload = { ...updates };

    delete payload.createdBy;
    delete payload.status;
    delete payload.slug;
    delete payload.ticketTypes;
    delete payload.registrationFormId;
    delete payload.volunteerFormId;

    if (payload.eventDate !== undefined) {
      const existingEvent = await Event.findById(id);
      if (!existingEvent) return null;

      payload.ticketTypes = recomputeAutoTicketExpiries(
        existingEvent.ticketTypes,
        payload.eventDate
      );
    }

    return await Event.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    logger.error(`[event.model] Error updating event ${id}: ${error.message}`);
    throw error;
  }
}

export async function updateEventStatus(id, status) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(
      `[event.model] Error updating event ${id} status: ${error.message}`
    );
    throw error;
  }
}

export async function setEventRegistrationForm(id, formSchemaId) {
  try {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(formSchemaId)) {
      return null;
    }

    return await Event.findByIdAndUpdate(
      id,
      { registrationFormId: formSchemaId },
      { new: true, runValidators: true }
    ).populate("registrationFormId");
  } catch (error) {
    logger.error(
      `[event.model] Error setting registration form for event ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function setEventVolunteerForm(id, formSchemaId) {
  try {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(formSchemaId)) {
      return null;
    }

    return await Event.findByIdAndUpdate(
      id,
      { volunteerFormId: formSchemaId },
      { new: true, runValidators: true }
    ).populate("volunteerFormId");
  } catch (error) {
    logger.error(
      `[event.model] Error setting volunteer form for event ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function addTicketTypeToEvent(id, ticketTypeData) {
  try {
    const event = await getEventById(id);
    if (!event) return null;

    event.ticketTypes.push(ticketTypeData);
    return await event.save();
  } catch (error) {
    logger.error(
      `[event.model] Error adding ticket type to event ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function updateEventTicketType(id, ticketTypeId, updates) {
  try {
    const event = await getEventById(id);
    if (!event) return null;

    const ticketType = event.ticketTypes.id(ticketTypeId);
    if (!ticketType) {
      return { event, ticketType: null };
    }

    ticketType.set(updates);
    await event.save();

    return { event, ticketType };
  } catch (error) {
    logger.error(
      `[event.model] Error updating ticket type ${ticketTypeId} on event ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function deleteEventTicketType(id, ticketTypeId) {
  try {
    const event = await getEventById(id);
    if (!event) return null;

    const ticketType = event.ticketTypes.id(ticketTypeId);
    if (!ticketType) {
      return { event, ticketType: null };
    }

    ticketType.deleteOne();
    await event.save();

    return { event, ticketType };
  } catch (error) {
    logger.error(
      `[event.model] Error deleting ticket type ${ticketTypeId} from event ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function incrementEventTicketSoldCount(
  id,
  ticketTypeId,
  quantity
) {
  try {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(ticketTypeId)) {
      return null;
    }

    return await Event.findOneAndUpdate(
      { _id: id, "ticketTypes._id": ticketTypeId },
      { $inc: { "ticketTypes.$.soldCount": quantity } },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(
      `[event.model] Error incrementing sold count for ticket type ${ticketTypeId} on event ${id}: ${error.message}`
    );
    throw error;
  }
}
