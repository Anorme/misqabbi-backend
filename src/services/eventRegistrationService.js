import {
  createEventRegistration,
  findActiveRegistrationByEventAndEmail,
} from "../models/eventRegistration.model.js";
import { getEventById } from "../models/event.model.js";
import { hasCapacity } from "./eventCapacityService.js";
import { validateFormSubmission } from "./formValidationService.js";
import { assertEventIsPublic } from "./eventPublicService.js";
import {
  assertFreeEventRegistration,
  assertNoDuplicateRegistration,
  resolveRegistrationEmail,
} from "./eventRegistrationLogic.js";

export {
  assertFreeEventRegistration,
  assertNoDuplicateRegistration,
  normalizeEmail,
  resolveRegistrationEmail,
} from "./eventRegistrationLogic.js";

const EMPTY_FORM_RESPONSES = {
  customAnswers: {},
};

export async function registerForFreeEvent({
  eventId,
  principal,
  guestInfo = {},
  formResponses = EMPTY_FORM_RESPONSES,
}) {
  const event = await getEventById(eventId);
  assertEventIsPublic(event);
  assertFreeEventRegistration(event);

  const registrationEmail = resolveRegistrationEmail(principal, guestInfo);
  const existingRegistration = await findActiveRegistrationByEventAndEmail(
    event._id,
    registrationEmail
  );
  assertNoDuplicateRegistration(existingRegistration);

  let normalizedGuestInfo = {};
  let normalizedResponses = EMPTY_FORM_RESPONSES;
  if (event.registrationFormId) {
    const validation = validateFormSubmission(event.registrationFormId, {
      identity: guestInfo,
      customAnswers: formResponses?.customAnswers ?? {},
      resolvedEmail: registrationEmail,
    });
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    normalizedGuestInfo = validation.normalizedIdentity;
    normalizedResponses = {
      customAnswers: validation.normalizedCustomAnswers,
    };
  }

  const hasRemainingCapacity = await hasCapacity(event, 1);
  if (!hasRemainingCapacity) {
    throw new Error("Event does not have enough remaining capacity");
  }

  return createEventRegistration({
    event: event._id,
    user: principal?._id ?? null,
    guestInfo: {
      ...guestInfo,
      ...normalizedGuestInfo,
      email: registrationEmail,
    },
    formResponses: normalizedResponses,
    status: "confirmed",
  });
}
