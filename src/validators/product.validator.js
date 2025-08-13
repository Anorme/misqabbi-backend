/**
 * Joi validation schema for Product creation/update.
 *
 * Fields:
 * - name: required, string, trimmed, non-empty
 * - description: optional, string, trimmed
 * - price: required, number, min 0
 * - images: optional, array of strings (URLs), max length 5
 * - category: required, string, lowercase, trimmed
 * - stock: required, number, min 0
 * - isPublished: optional, boolean
 * - createdBy: optional, valid ObjectId string (references User)
 */
