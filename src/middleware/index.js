const verifyToken = require("./auth.middleware");
const errorHandler = require("./error.middleware");
const checkAdmin = require("./rbac.middleware");

module.exports = {
  verifyToken,
  checkAdmin,
  errorHandler,
};
