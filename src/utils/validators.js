const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[A-Za-z\d\S]{8,}$/;

const OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

// Valid sort options for products
const VALID_SORT_OPTIONS = [
  "latest",
  "price-low-high",
  "price-high-low",
  "name-a-z",
  "name-z-a",
];

export function isPasswordValidOrGoogleUser(value, doc) {
  return doc.googleId || STRONG_PASSWORD_REGEX.test(value);
}

export function isValidSortOption(sortValue) {
  return VALID_SORT_OPTIONS.includes(sortValue);
}

export {
  EMAIL_REGEX,
  STRONG_PASSWORD_REGEX,
  OBJECTID_REGEX,
  VALID_SORT_OPTIONS,
};
