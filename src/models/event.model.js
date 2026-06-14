import { Types } from "mongoose";
import Event from "./event.mongo.js";
import logger from "../config/logger.js";

export async function createEvent(eventData, adminId) {
  try {
    return await Event.create({
      ...eventData,
      status: "draft",
      createdBy: adminId,
    });
  } catch (error) {
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

    return await Event.findById(id);
  } catch (error) {
    logger.error(`[event.model] Error finding event ${id}: ${error.message}`);
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

    delete updates.createdBy;
    delete updates.status;

    return await Event.findByIdAndUpdate(id, updates, {
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
