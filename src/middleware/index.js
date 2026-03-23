import {
  authenticateToken,
  authenticateOptionalPrincipal,
  checkAdmin,
} from "./auth.middleware.js";
import errorHandler from "./error.middleware.js";

export {
  authenticateToken,
  authenticateOptionalPrincipal,
  checkAdmin,
  errorHandler,
};
