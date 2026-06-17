import slugify from "slugify";

const ROMAN_NUMERALS = [
  ["m", 1000],
  ["cm", 900],
  ["d", 500],
  ["cd", 400],
  ["c", 100],
  ["xc", 90],
  ["l", 50],
  ["xl", 40],
  ["x", 10],
  ["ix", 9],
  ["v", 5],
  ["iv", 4],
  ["i", 1],
];

export function toRomanLower(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Roman numeral value must be a positive integer");
  }

  let remaining = value;
  let numeral = "";

  for (const [symbol, amount] of ROMAN_NUMERALS) {
    while (remaining >= amount) {
      numeral += symbol;
      remaining -= amount;
    }
  }

  return numeral;
}

export function buildEventSlug(name) {
  return (
    slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    }) || "event"
  );
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildEventSlugFamilyFilter(baseSlug) {
  return {
    $or: [
      { slug: baseSlug },
      { slug: { $regex: `^${escapeRegExp(baseSlug)}-[ivxlcdm]+$` } },
    ],
  };
}

export function buildUniqueEventSlug(baseSlug, existingCount) {
  if (existingCount === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${toRomanLower(existingCount + 1)}`;
}
