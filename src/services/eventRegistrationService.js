import {
  createEventRegistration,
  findActiveRegistrationByEventAndEmail,
} from "../models/eventRegistration.model.js";
import { getEventById } from "../models/event.model.js";
import { hasCapacity } from "./eventCapacityService.js";
import { validateFormResponses } from "./formValidationService.js";
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
  builtinFields: {},
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

  let normalizedResponses = EMPTY_FORM_RESPONSES;
  if (event.registrationFormId) {
    const validation = validateFormResponses(
      event.registrationFormId,
      formResponses
    );
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    normalizedResponses = validation.normalizedResponses;
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
      email: registrationEmail,
    },
    formResponses: normalizedResponses,
    status: "confirmed",
  });
}
