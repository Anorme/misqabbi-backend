import { userValidator } from "../validators/user.validator.js";
import { productValidator } from "../validators/product.validator.js";
import { orderValidator } from "../validators/order.validator.js";
import { newsletterValidator } from "../validators/newsletter.validator.js";

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
  const { error } = productValidator.validate(req.body, { abortEarly: false });
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
