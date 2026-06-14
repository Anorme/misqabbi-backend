/*eslint-disable no-undef */
import {
  assertNoDuplicateVolunteerApplication,
  assertVolunteerApplicationAllowed,
  resolveApplicantEmail,
} from "../../../src/services/volunteerApplicationSubmitLogic.js";

describe("volunteerApplicationSubmitLogic", () => {
  const event = {
    status: "published",
    volunteerFormId: "64a000000000000000000020",
  };

  it("allows volunteer applications for published events with a volunteer form", () => {
    expect(() => assertVolunteerApplicationAllowed(event)).not.toThrow();
  });

  it("rejects non-public events", () => {
    expect(() =>
      assertVolunteerApplicationAllowed({ ...event, status: "draft" })
    ).toThrow("Event not found");
  });

  it("requires a configured volunteer form", () => {
    expect(() =>
      assertVolunteerApplicationAllowed({ ...event, volunteerFormId: null })
    ).toThrow("Volunteer applications are not enabled for this event");
  });

  it("blocks duplicate volunteer applications", () => {
    expect(() => assertNoDuplicateVolunteerApplication(null)).not.toThrow();
    expect(() =>
      assertNoDuplicateVolunteerApplication({ _id: "application-id" })
    ).toThrow("This email has already applied to volunteer for the event");
  });

  it("normalizes and validates applicant email addresses", () => {
    expect(resolveApplicantEmail({ email: " Applicant@Example.COM " })).toBe(
      "applicant@example.com"
    );
    expect(() => resolveApplicantEmail({ email: "not-email" })).toThrow(
      "A valid email is required to apply to volunteer"
    );
  });
});
