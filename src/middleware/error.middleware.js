import logger from "../config/logger.js";
import env from "../config/env.js";

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { NODE_ENV } = env;
  const isDev = NODE_ENV === "development";

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(err.message, {
    method: req.method,
    path: req.originalUrl,
    user: req.user?.id || "anonymous",
    statusCode: statusCode,
    ...(isDev && { stack: err.stack }),
  });

  res.status(statusCode).json({
    message,
    ...(isDev && { stack: err.stack }),
  });
}

export default errorHandler;
