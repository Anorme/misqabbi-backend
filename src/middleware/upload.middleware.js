import logger from "../config/logger.js";
import cloudinary from "../config/cloudinary.js";

export const getOptimisedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    width: 800,
    crop: "limit",
    fetch_format: "auto",
    quality: "auto",
    secure: true,
    ...options,
  });
};

export const attachImagesToBody = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Map multer-storage-cloudinary file objects to { url, publicId }
    req.body.images = req.files.map(file => {
      const publicId = file.filename;
      const url = getOptimisedUrl(publicId);
      return { url, publicId };
    });
  }
  logger.info(
    `[upload.middleware] Attached ${req.files.length} images to request body`
  );
  next();
};
