/*eslint-disable no-undef */
import {
  assertFreeEventRegistration,
  assertNoDuplicateRegistration,
  normalizeEmail,
  resolveRegistrationEmail,
} from "../../../src/services/eventRegistrationLogic.js";

describe("eventRegistrationLogic", () => {
  const freeEvent = {
    type: "free",
    status: "published",
    eventDate: "2026-08-01T18:00:00.000Z",
  };

  it("normalizes email addresses for duplicate checks", () => {
    expect(normalizeEmail(" Guest@Example.COM ")).toBe("guest@example.com");
    expect(normalizeEmail(null)).toBe("");
  });

  it("prefers authenticated user email and falls back to guest info", () => {
    expect(
      resolveRegistrationEmail(
        { type: "user", user: { email: "Member@Example.com" } },
        { email: "guest@example.com" }
      )
    ).toBe("member@example.com");

    expect(
      resolveRegistrationEmail({ type: "guest" }, { email: "Guest@Example.com" })
    ).toBe("guest@example.com");
  });

  it("requires a valid email address", () => {
    expect(() => resolveRegistrationEmail({ type: "guest" }, {})).toThrow(
      "A valid email is required to register for an event"
    );
    expect(() =>
      resolveRegistrationEmail({ type: "guest" }, { email: "not-email" })
    ).toThrow("A valid email is required to register for an event");
  });

  it("blocks duplicate registrations", () => {
    expect(() => assertNoDuplicateRegistration(null)).not.toThrow();
    expect(() => assertNoDuplicateRegistration({ _id: "registration-id" })).toThrow(
      "This email is already registered for the event"
    );
  });

  it("allows free RSVP only for published free events", () => {
    const beforeEvent = new Date("2026-07-01T00:00:00.000Z");
    expect(() =>
      assertFreeEventRegistration(freeEvent, beforeEvent)
    ).not.toThrow();
    expect(() =>
      assertFreeEventRegistration({ ...freeEvent, type: "paid" }, beforeEvent)
    ).toThrow("Free RSVP is only available for free events");
    expect(() =>
      assertFreeEventRegistration({ ...freeEvent, status: "draft" }, beforeEvent)
    ).toThrow("Only published events accept registrations");
  });

  it("blocks free RSVP after eventDate", () => {
    expect(() =>
      assertFreeEventRegistration(
        freeEvent,
        new Date("2026-08-01T18:00:00.000Z")
      )
    ).toThrow("Registration for this event has closed");
  });
});
