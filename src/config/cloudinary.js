import env from "./env.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const productUploads = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "misqabbi/products",
    },
  }),
});

export async function deleteAssets(publicIds = []) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return;
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    logger.warn(
      `[cloudinary] Failed deleting assets: ${publicIds.join(", ")}: ${error.message}`
    );
    throw error;
  }
}

export default cloudinary;
