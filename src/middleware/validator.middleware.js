import { userValidator } from "../validators/user.validator.js";


export function validateUser(req, res, next) {
  const { error } = userValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}