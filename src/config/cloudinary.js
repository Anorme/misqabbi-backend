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

/**
 * Extracts the Cloudinary public_id from a Cloudinary URL
 * @param {string} url - Cloudinary URL (e.g., https://res.cloudinary.com/.../misqabbi/products/image.jpg)
 * @returns {string|null} - The public_id (e.g., misqabbi/products/image) or null if extraction fails
 */
export function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;

  const folderMarker = "misqabbi/";
  const idx = url.indexOf(folderMarker);
  if (idx === -1) return null;

  // Extract everything after "misqabbi/"
  const afterFolder = url.substring(idx);

  // Remove file extension (everything after last dot)
  const lastDot = afterFolder.lastIndexOf(".");
  return lastDot === -1 ? afterFolder : afterFolder.substring(0, lastDot);
}

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
