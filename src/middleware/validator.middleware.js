import { userValidator } from "../validators/user.validator.js";

export function validateUser(req, res, next) {
  const { error } = userValidator.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}
