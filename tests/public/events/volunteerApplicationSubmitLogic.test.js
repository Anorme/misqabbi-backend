/*eslint-disable no-undef */
import {
  assertNoDuplicateVolunteerApplication,
  assertVolunteerApplicationAllowed,
  resolveApplicantEmail,
} from "../../../src/services/volunteerApplicationSubmitLogic.js";

describe("volunteerApplicationSubmitLogic", () => {
  const eventDate = "2026-08-01T18:00:00.000Z";
  const beforeEvent = new Date("2026-07-01T00:00:00.000Z");
  const event = {
    status: "published",
    eventDate,
    volunteerFormId: "64a000000000000000000020",
  };

  it("allows volunteer applications for published events with a volunteer form", () => {
    expect(() =>
      assertVolunteerApplicationAllowed(event, beforeEvent)
    ).not.toThrow();
  });

  it("rejects non-public events", () => {
    expect(() =>
      assertVolunteerApplicationAllowed(
        { ...event, status: "draft" },
        beforeEvent
      )
    ).toThrow("Event not found");
  });

  it("requires a configured volunteer form", () => {
    expect(() =>
      assertVolunteerApplicationAllowed(
        { ...event, volunteerFormId: null },
        beforeEvent
      )
    ).toThrow("Volunteer applications are not enabled for this event");
  });

  it("blocks volunteer applications after eventDate", () => {
    expect(() =>
      assertVolunteerApplicationAllowed(event, new Date(eventDate))
    ).toThrow("Registration for this event has closed");
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
