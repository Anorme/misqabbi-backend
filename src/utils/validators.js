const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-+])[A-Za-z\d@$!%*?&#^_\-+]{8,}$/;

const OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

export function isPasswordValidOrGoogleUser(value, doc) {
  return doc.googleId || STRONG_PASSWORD_REGEX.test(value);
}

export { EMAIL_REGEX, STRONG_PASSWORD_REGEX , OBJECTID_REGEX };
