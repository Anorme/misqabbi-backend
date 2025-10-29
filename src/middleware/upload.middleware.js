import logger from "../config/logger.js";
import { extractPublicIdFromUrl } from "../config/cloudinary.js";

export const attachImagesToBody = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Map multer-storage-cloudinary file objects to { url, publicId }
    req.body.images = req.files.map(file => ({
      url: file.path,
      publicId: extractPublicIdFromUrl(file.path),
    }));
  }
  logger.info(
    `[upload.middleware] Attached ${req.files.length} images to request body`
  );
  next();
};
