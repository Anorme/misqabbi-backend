// validators/authValidator.js
import { body } from "express-validator";

//  Validation rules for user registration
export const registerValidation = [
  body("displayName").trim().notEmpty().withMessage("Name is required"),

  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-+])[A-Za-z\d@$!%*?&#^_\-+]{8,}$/
    )
    .withMessage("Password must contain a special character"),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
];

//  Validation rules for user login
export const loginValidation = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Valid email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];
