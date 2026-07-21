export const EVENT_WHEN_FILTERS = new Set(["upcoming", "past", "all"]);

export function resolvePublicWhenFilter(when) {
  const normalized = typeof when === "string" ? when.trim().toLowerCase() : "";
  if (!normalized) return "upcoming";
  if (!EVENT_WHEN_FILTERS.has(normalized)) {
    throw new Error("Invalid when filter. Use upcoming, past, or all");
  }
  return normalized;
}
