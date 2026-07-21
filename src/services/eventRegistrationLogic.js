import { assertEventAcceptsRegistrations } from "./eventCapacityLogic.js";
import { assertEventRegistrationOpen } from "./eventRegistrationWindowLogic.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function resolveRegistrationEmail(principal, guestInfo = {}) {
  const email =
    principal?.type === "user" && principal.user?.email
      ? principal.user.email
      : guestInfo.email;
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("A valid email is required to register for an event");
  }

  return normalizedEmail;
}

export function assertNoDuplicateRegistration(existingRegistration) {
  if (existingRegistration) {
    throw new Error("This email is already registered for the event");
  }
}

export function assertFreeEventRegistration(event, now = new Date()) {
  assertEventAcceptsRegistrations(event);
  assertEventRegistrationOpen(event, now);

  if (event.type !== "free") {
    throw new Error("Free RSVP is only available for free events");
  }
}
