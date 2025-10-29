import logger from "../config/logger.js";

export const attachImagesToBody = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => file.path);
  }
  logger.info(
    `[upload.middleware] Attached ${req.files.length} images to request body`
  );
  next();
};
