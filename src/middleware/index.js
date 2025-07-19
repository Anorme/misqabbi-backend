const { authenticateToken, checkAdmin } = require("./auth.middleware");
const errorHandler = require("./error.middleware");

module.exports = {
  authenticateToken,
  checkAdmin,
  errorHandler,
};
