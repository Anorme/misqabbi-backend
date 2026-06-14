import { getEventById } from "../models/event.model.js";
import {
  createVolunteerApplication,
  findActiveVolunteerApplicationByEventAndEmail,
} from "../models/volunteerApplication.model.js";
import { validateFormSubmission } from "./formValidationService.js";
import {
  assertNoDuplicateVolunteerApplication,
  assertVolunteerApplicationAllowed,
  resolveApplicantEmail,
} from "./volunteerApplicationSubmitLogic.js";

export {
  VOLUNTEER_APPLICATION_STATUSES,
  VOLUNTEER_APPLICATION_STATUS_TRANSITIONS,
  assertVolunteerApplicationStatusTransition,
  canTransitionVolunteerApplicationStatus,
} from "./volunteerApplicationLogic.js";

export {
  assertNoDuplicateVolunteerApplication,
  assertVolunteerApplicationAllowed,
  resolveApplicantEmail,
} from "./volunteerApplicationSubmitLogic.js";

const EMPTY_FORM_RESPONSES = {
  customAnswers: {},
};

export async function submitVolunteerApplication({
  eventId,
  applicantInfo = {},
  formResponses = EMPTY_FORM_RESPONSES,
}) {
  const event = await getEventById(eventId);
  assertVolunteerApplicationAllowed(event);

  const applicantEmail = resolveApplicantEmail(applicantInfo);
  const existingApplication =
    await findActiveVolunteerApplicationByEventAndEmail(
      event._id,
      applicantEmail
    );
  assertNoDuplicateVolunteerApplication(existingApplication);

  const validation = validateFormSubmission(event.volunteerFormId, {
    identity: applicantInfo,
    customAnswers: formResponses?.customAnswers ?? {},
  });
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  return createVolunteerApplication({
    event: event._id,
    applicantInfo: {
      ...applicantInfo,
      ...validation.normalizedIdentity,
      email: applicantEmail,
    },
    formResponses: {
      customAnswers: validation.normalizedCustomAnswers,
    },
    status: "pending",
  });
}
