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

export const attachEventBannerToBody = (req, res, next) => {
  const bannerFile = req.files?.banner?.[0] || req.file;

  if (bannerFile) {
    const publicId = bannerFile.filename;
    req.body.banner = {
      url: getOptimisedUrl(publicId),
      publicId,
    };
  }

  logger.info(
    `[upload.middleware] Attached event banner: ${req.body.banner ? "yes" : "no"}`
  );
  next();
};

/**
 * After bespoke reference photo uploads (multer with referencePhotos field), map
 * req.files to req.body.referencePhotoUrls (array of Cloudinary URLs) for validator and email template.
 */
export const attachBespokeReferencePhotoUrlsToBody = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length > 0) {
    req.body.referencePhotoUrls = files.map(file => {
      const publicId = file.filename;
      return getOptimisedUrl(publicId);
    });
  } else {
    req.body.referencePhotoUrls = [];
  }
  logger.info(
    `[upload.middleware] Attached ${req.body.referencePhotoUrls?.length ?? 0} reference photo URL(s) to body`
  );
  next();
};
