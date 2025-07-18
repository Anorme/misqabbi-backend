const User = require("./users.mongo");

async function createUser({ email, password, displayName }) {
  const user = new User({ email, password, displayName });
  return await user.save();
}

async function findUserByEmail(email) {
  return await User.findOne({ email });
}

async function findUserById(id) {
  return await User.findById({ id });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
