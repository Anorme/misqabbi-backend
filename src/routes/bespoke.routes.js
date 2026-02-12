import express from "express";
import { bespokeReferenceUploads } from "../config/cloudinary.js";
import { attachBespokeReferencePhotoUrlsToBody } from "../middleware/upload.middleware.js";
import { validateBespoke } from "../middleware/validator.middleware.js";
import { submitBespoke } from "../controllers/bespoke.controller.js";
import { formatResponse } from "../utils/responseFormatter.js";

const router = express.Router();

/**
 * Handle multer errors (e.g. file size, file count, file type) with 400 and clear message for frontend toast.
 */
function handleBespokeUploadError(err, req, res, next) {
  if (err) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "One or more files exceed the 10 MB limit"
        : err.code === "LIMIT_FILE_COUNT"
          ? "Maximum 5 reference photos allowed"
          : err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Unexpected file field"
            : err.message || "Invalid file upload";
    return res.status(400).json(formatResponse({ success: false, message }));
  }
  next();
}

/**
 * @swagger
 * /bespoke:
 *   post:
 *     summary: Submit a bespoke form
 *     description: Submit a bespoke form (multipart/form-data) with fullName, email, description, optional garmentType, measurements, styleNotes, referencePhotos. Sends email to admin; no persistence.
 *     tags:
 *       - Bespoke
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - description
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               garmentType:
 *                 type: string
 *                 enum: [pants, skirts, dresses, dungarees, other]
 *               garmentTypeOther:
 *                 type: string
 *               measurements:
 *                 type: string
 *               styleNotes:
 *                 type: string
 *               description:
 *                 type: string
 *                 minLength: 10
 *               referencePhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Bespoke form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bespoke form submitted successfully"
 *       400:
 *         description: Validation or upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  (req, res, next) => {
    bespokeReferenceUploads(req, res, err => {
      if (err) return handleBespokeUploadError(err, req, res, next);
      next();
    });
  },
  attachBespokeReferencePhotoUrlsToBody,
  validateBespoke,
  submitBespoke
);

export default router;
