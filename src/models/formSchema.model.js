import { Types } from "mongoose";
import logger from "../config/logger.js";
import FormSchema from "./formSchema.mongo.js";

export async function createFormSchema(formSchemaData, adminId) {
  try {
    return await FormSchema.create({
      ...formSchemaData,
      createdBy: adminId,
    });
  } catch (error) {
    logger.error(
      `[formSchema.model] Error creating form schema: ${error.message}`
    );
    throw error;
  }
}

export async function getFormSchemaById(id) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      logger.warn(`[formSchema.model] Invalid form schema ID: ${id}`);
      return null;
    }

    return await FormSchema.findById(id);
  } catch (error) {
    logger.error(
      `[formSchema.model] Error finding form schema ${id}: ${error.message}`
    );
    throw error;
  }
}

export async function updateFormSchema(id, updates) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    delete updates.createdBy;

    return await FormSchema.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    logger.error(
      `[formSchema.model] Error updating form schema ${id}: ${error.message}`
    );
    throw error;
  }
}
