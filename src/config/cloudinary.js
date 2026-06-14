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

export const eventBannerUploads = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "misqabbi/events",
    },
  }),
});

const BESPOKE_REFERENCE_MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file
const BESPOKE_REFERENCE_MAX_COUNT = 5;

const bespokeReferenceFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed for reference photos"), false);
    return;
  }
  cb(null, true);
};

export const bespokeReferenceUploads = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "misqabbi/bespoke",
    },
  }),
  limits: {
    fileSize: BESPOKE_REFERENCE_MAX_SIZE,
  },
  fileFilter: bespokeReferenceFileFilter,
}).array("referencePhotos", BESPOKE_REFERENCE_MAX_COUNT);

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
