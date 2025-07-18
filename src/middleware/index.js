const { verifyToken, checkAdmin } = require("./auth.middleware");
const errorHandler = require("./error.middleware");

module.exports = {
  verifyToken,
  checkAdmin,
  errorHandler,
};
