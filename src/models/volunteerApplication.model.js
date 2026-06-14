import { Types } from "mongoose";
import logger from "../config/logger.js";
import VolunteerApplication from "./volunteerApplication.mongo.js";

export async function createVolunteerApplication(applicationData) {
  try {
    return await VolunteerApplication.create(applicationData);
  } catch (error) {
    logger.error(
      `[volunteerApplication.model] Error creating volunteer application: ${error.message}`
    );
    throw error;
  }
}

export async function getPaginatedVolunteerApplications(
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

    return await VolunteerApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } catch (error) {
    logger.error(
      `[volunteerApplication.model] Error listing volunteer applications for event ${eventId}: ${error.message}`
    );
    throw error;
  }
}

export async function countVolunteerApplications(eventId, params = {}) {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      return 0;
    }

    const filter = { event: eventId };

    if (params.status) {
      filter.status = params.status;
    }

    return await VolunteerApplication.countDocuments(filter);
  } catch (error) {
    logger.error(
      `[volunteerApplication.model] Error counting volunteer applications for event ${eventId}: ${error.message}`
    );
    throw error;
  }
}

export async function getVolunteerApplicationById(eventId, applicationId) {
  try {
    if (
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(applicationId)
    ) {
      return null;
    }

    return await VolunteerApplication.findOne({
      _id: applicationId,
      event: eventId,
    });
  } catch (error) {
    logger.error(
      `[volunteerApplication.model] Error finding volunteer application ${applicationId}: ${error.message}`
    );
    throw error;
  }
}

export async function updateVolunteerApplicationStatus(
  eventId,
  applicationId,
  status
) {
  try {
    if (
      !Types.ObjectId.isValid(eventId) ||
      !Types.ObjectId.isValid(applicationId)
    ) {
      return null;
    }

    return await VolunteerApplication.findOneAndUpdate(
      { _id: applicationId, event: eventId },
      { status },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(
      `[volunteerApplication.model] Error updating volunteer application ${applicationId}: ${error.message}`
    );
    throw error;
  }
}
