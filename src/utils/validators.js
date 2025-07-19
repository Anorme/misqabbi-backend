const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-+])[A-Za-z\d@$!%*?&#^_\-+]{8,}$/;

module.exports = {
  EMAIL_REGEX,
  STRONG_PASSWORD_REGEX,
};
