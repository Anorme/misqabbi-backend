import { hasLinkedForm } from "./eventFormLogic.js";
import { assertEventIsPublic } from "./eventPublicLogic.js";
import { assertEventRegistrationOpen } from "./eventRegistrationWindowLogic.js";
import { normalizeEmail } from "./eventRegistrationLogic.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertVolunteerApplicationAllowed(event, now = new Date()) {
  assertEventIsPublic(event);
  assertEventRegistrationOpen(event, now);

  if (!hasLinkedForm(event, "volunteerFormId")) {
    throw new Error("Volunteer applications are not enabled for this event");
  }
}

export function assertNoDuplicateVolunteerApplication(existingApplication) {
  if (existingApplication) {
    throw new Error(
      "This email has already applied to volunteer for the event"
    );
  }
}

export function resolveApplicantEmail(applicantInfo = {}) {
  const normalizedEmail = normalizeEmail(applicantInfo.email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("A valid email is required to apply to volunteer");
  }

  return normalizedEmail;
}
