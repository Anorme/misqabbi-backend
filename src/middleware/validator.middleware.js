import { userValidator } from "../validators/user.validator.js";
import { productValidator } from "../validators/product.validator.js";
import { variantProductValidator } from "../validators/variant.validator.js";
import { orderValidator } from "../validators/order.validator.js";
import { newsletterValidator } from "../validators/newsletter.validator.js";
import { contactValidator } from "../validators/contact.validator.js";

export function validateUser(req, res, next) {
  const { error } = userValidator.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateProduct(req, res, next) {
  // For updates (PUT/PATCH), make required fields optional to allow partial updates
  const isUpdate = req.method === "PUT" || req.method === "PATCH";

  const schema = isUpdate
    ? productValidator.fork(["name", "price", "category", "stock"], schema =>
        schema.optional()
      )
    : productValidator;

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true, // Allow fields not in schema (like images from middleware)
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateVariantProduct(req, res, next) {
  const { error } = variantProductValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateOrder(req, res, next) {
  const { error } = orderValidator.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateNewsletter(req, res, next) {
  const { error } = newsletterValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateContact(req, res, next) {
  const { error } = contactValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}
