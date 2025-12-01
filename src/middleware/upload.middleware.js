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

/**
 * Helper function to convert file array to image objects
 * @param {Array} files - Array of multer file objects
 * @returns {Array} Array of { url, publicId } objects
 */
const mapFilesToImages = files => {
  if (!files || files.length === 0) return [];
  return files.map(file => {
    const publicId = file.filename;
    const url = getOptimisedUrl(publicId);
    return { url, publicId };
  });
};

export const attachImagesToBody = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = mapFilesToImages(req.files);
  }
  logger.info(
    `[upload.middleware] Attached ${req.files?.length || 0} images to request body`
  );
  next();
};

/**
 * Middleware to handle product image uploads with separate fields:
 * - swatchImage: single file field for the color/print picker image (optional)
 * - images: array of files for the gallery images (max 5)
 * Works for both base products and variants
 */
export const attachProductImagesToBody = (req, res, next) => {
  // Handle swatchImage (single file, optional)
  if (req.files?.swatchImage && req.files.swatchImage.length > 0) {
    const swatchFile = req.files.swatchImage[0];
    const swatchPublicId = swatchFile.filename;
    req.body.swatchImage = {
      url: getOptimisedUrl(swatchPublicId),
      publicId: swatchPublicId,
    };
  }

  // Handle gallery images (array of files) - only set if files are uploaded
  if (req.files?.images && req.files.images.length > 0) {
    req.body.images = mapFilesToImages(req.files.images);
  }

  logger.info(
    `[upload.middleware] Attached swatch image: ${req.body.swatchImage ? "yes" : "no"}, gallery images: ${req.body.images?.length || 0}`
  );
  next();
};

/**
 * Middleware to handle variant image uploads with separate fields:
 * - swatchImage: single file field for the color/print picker image (required for variants)
 * - images: array of files for the gallery images (max 5)
 * Alias for attachProductImagesToBody for backward compatibility
 */
export const attachVariantImagesToBody = attachProductImagesToBody;
